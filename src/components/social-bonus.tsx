"use client";

import { Check, ImagePlus, Loader2, Share2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { subscribe } from "@/hooks/use-live-game";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Submission = {
  id: string;
  participant_id: string;
  status: string;
  screenshot_paths: string[];
  participant?: { nickname: string } | null;
};

const BUCKET = "social_screenshots";

async function signUrls(paths: string[]) {
  if (!paths.length) return [];
  const { data } = await createClient()
    .storage.from(BUCKET)
    .createSignedUrls(paths, 60 * 30);
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => Boolean(u));
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "approved" && "bg-mint/15 text-mint",
        status === "rejected" && "bg-ember/15 text-ember",
        status === "pending" && "bg-sun/15 text-sun",
      )}
    >
      {status === "pending" ? "In review" : status === "approved" ? "Approved" : "Rejected"}
    </span>
  );
}

/** Player side: upload screenshots of a share to claim the quiz's bonus points. */
export function SocialBonusSubmit({
  gameId,
  participantId,
  points,
  shareLink,
  onApproved,
}: {
  gameId: string;
  participantId: string;
  points: number;
  shareLink: string | null;
  onApproved?: () => void;
}) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("social_bonus_submissions")
      .select("id, participant_id, status, screenshot_paths")
      .eq("participant_id", participantId)
      .maybeSingle()
      .then(({ data }) => setSubmission(data));

    return subscribe(() =>
      supabase
        .channel(`bonus-${participantId}:${crypto.randomUUID().slice(0, 8)}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "social_bonus_submissions", filter: `participant_id=eq.${participantId}` },
          (payload) => {
            const next = payload.new as Submission;
            setSubmission(next);
            if (next.status === "approved") onApproved?.();
          },
        )
        .subscribe(),
    );
  }, [participantId, onApproved]);

  async function submit() {
    if (!files.length) return;
    setBusy(true);
    const supabase = createClient();
    const paths: string[] = [];
    for (const [i, file] of files.entries()) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${gameId}/${participantId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (error) {
        setBusy(false);
        toast.error("Upload failed", { description: error.message });
        return;
      }
      paths.push(path);
    }
    const query = submission
      ? supabase.from("social_bonus_submissions").update({ screenshot_paths: paths, status: "pending" }).eq("id", submission.id)
      : supabase.from("social_bonus_submissions").insert({ participant_id: participantId, screenshot_paths: paths });
    const { data, error } = await query.select("id, participant_id, status, screenshot_paths").single();
    setBusy(false);
    if (error) {
      toast.error("Could not send your screenshots", { description: error.message });
      return;
    }
    setSubmission(data);
    setFiles([]);
    toast.success("Sent to the host for review");
  }

  const canSubmit = !submission || submission.status === "rejected";

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="t-eyebrow mb-2 flex items-center gap-2">
            <Share2 className="size-3.5" /> Share bonus
          </p>
          <h2 className="text-2xl">Earn +{points} points</h2>
        </div>
        {submission && <StatusPill status={submission.status} />}
      </div>
      {canSubmit ? (
        <>
          <p className="mb-5 text-[15px] text-muted-foreground">
            {submission?.status === "rejected"
              ? "The host did not accept your last screenshots. Send new ones."
              : "Share this quiz on social media, then upload a screenshot of your post."}
            {shareLink && (
              <>
                {" "}
                <a href={shareLink} target="_blank" rel="noreferrer" className="link text-foreground">
                  Open the share link
                </a>
              </>
            )}
          </p>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-8 text-center transition-colors hover:border-[var(--p-line-strong)]",
              files.length && "border-primary/60",
            )}
          >
            <ImagePlus className="size-6 text-muted-foreground" />
            <span className="text-[15px]">
              {files.length ? `${files.length} screenshot${files.length > 1 ? "s" : ""} selected` : "Choose screenshots"}
            </span>
            <span className="text-xs text-muted-foreground">PNG, JPG or WebP, up to 10 MB each</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])].slice(0, 4))}
            />
          </label>
          <Button className="mt-4 w-full" onClick={submit} disabled={!files.length || busy}>
            {busy && <Loader2 className="animate-spin" />}
            Send for review
          </Button>
        </>
      ) : (
        <p className="text-[15px] text-muted-foreground">
          {submission.status === "approved"
            ? `The host approved your share. +${points} points are in your score.`
            : "The host will check your screenshots before the game closes."}
        </p>
      )}
    </section>
  );
}

/** Host side: approve or reject players' share screenshots. */
export function SocialBonusReview({ gameId, points, onChange }: { gameId: string; points: number; onChange?: () => void }) {
  const [subs, setSubs] = useState<(Submission & { urls: string[] })[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("social_bonus_submissions")
      .select("id, participant_id, status, screenshot_paths, participant:participants!inner(nickname, game_id)")
      .eq("participant.game_id", gameId)
      .order("created_at");
    const withUrls = await Promise.all((data ?? []).map(async (s) => ({ ...s, urls: await signUrls(s.screenshot_paths) })));
    setSubs(withUrls);
  }, [gameId]);

  useEffect(() => {
    const supabase = createClient();
    // RLS limits these events to submissions in games this user hosts.
    return subscribe(() =>
      supabase
        .channel(`bonus-review-${gameId}:${crypto.randomUUID().slice(0, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "social_bonus_submissions" }, () => void load())
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void load();
        }),
    );
  }, [gameId, load]);

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await createClient().from("social_bonus_submissions").update({ status }).eq("id", id);
    if (error) toast.error("Could not save the decision", { description: error.message });
    else {
      setSubs((list) => list.map((s) => (s.id === id ? { ...s, status } : s)));
      onChange?.();
    }
  }

  return (
    <section className="card p-6">
      <p className="t-eyebrow mb-2 flex items-center gap-2">
        <Share2 className="size-3.5" /> Share bonus · +{points}
      </p>
      <h2 className="mb-5 text-2xl">Review shares</h2>
      {subs.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">Players can send screenshots from their results screen. They appear here.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {subs.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line bg-surface-2/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="truncate font-medium">{s.participant?.nickname}</span>
                <StatusPill status={s.status} />
              </div>
              <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
                {s.urls.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setPreview(url)}
                    className="zoom size-20 shrink-0 rounded-xl border border-line"
                    aria-label="Open screenshot"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-mint text-[#062417] hover:bg-mint"
                  disabled={s.status === "approved"}
                  onClick={() => decide(s.id, "approved")}
                >
                  <Check /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={s.status === "rejected"}
                  onClick={() => decide(s.id, "rejected")}
                >
                  <X /> Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-3">
          <DialogTitle className="sr-only">Screenshot</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
          {preview && <img src={preview} alt="Shared screenshot" className="max-h-[80vh] w-full rounded-2xl object-contain" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
