"use client";

import { Check, Copy, Loader2, Play, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayerAvatar } from "@/components/user-menu";
import { formatCode, quizImageUrl, siteUrl, type Game, type ParticipantWithProfile, type QuizWithQuestions } from "@/lib/game";
import { preloadImages } from "@/lib/preload";
import { createClient } from "@/lib/supabase/client";

export function HostLobby({
  game,
  quiz,
  participants,
  onStart,
}: {
  game: Game;
  quiz: QuizWithQuestions;
  participants: ParticipantWithProfile[];
  onStart: () => Promise<void>;
}) {
  const [loaded, setLoaded] = useState({ done: 0, total: 1 });
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const joinUrl = siteUrl(`/?code=${game.code}`);
  const joinHost = useMemo(() => joinUrl.replace(/^https?:\/\//, "").replace(/\/\?.*$/, ""), [joinUrl]);

  useEffect(() => {
    const urls = quiz.questions.map((q) => quizImageUrl(quiz.id, q.image)).filter((u): u is string => Boolean(u));
    void preloadImages(urls, (done, total) => setLoaded({ done, total: Math.max(total, 1) }));
  }, [quiz]);

  const ready = loaded.done >= loaded.total || loaded.total <= 1;

  async function copy() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function kick(p: ParticipantWithProfile) {
    const { error } = await createClient().from("participants").delete().eq("id", p.id);
    if (error) toast.error(`Could not remove ${p.nickname}`);
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <section className="flex flex-col">
        <p className="t-eyebrow mb-4">Join at {joinHost} with the code</p>
        <motion.h1
          className="font-mono text-[clamp(4.5rem,13vw,10rem)] leading-none font-medium tracking-tight tabular"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {formatCode(game.code)}
        </motion.h1>

        <div className="mt-10 mb-5 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-2xl">
            <Users className="size-6 text-muted-foreground" />
            <span>
              <span className="font-mono tabular">{participants.length}</span> {participants.length === 1 ? "player" : "players"} in the lobby
            </span>
          </h2>
        </div>

        <div className="card min-h-56 flex-1 p-4 sm:p-6">
          {participants.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <span className="flex gap-1.5">
                {["bg-ember", "bg-sky", "bg-sun", "bg-mint"].map((c, i) => (
                  <motion.span
                    key={c}
                    className={`size-3 rounded-full ${c}`}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </span>
              Waiting for players to join
            </div>
          ) : (
            <ul className="flex flex-wrap gap-3">
              <AnimatePresence>
                {participants.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    className="group flex items-center gap-2.5 rounded-full border border-line bg-surface-2 py-1.5 pr-2 pl-1.5"
                  >
                    <PlayerAvatar name={p.nickname} src={p.profile?.avatar_url} className="size-8" />
                    <span className="max-w-40 truncate text-[15px] font-medium">{p.nickname}</span>
                    <button
                      type="button"
                      onClick={() => kick(p)}
                      className="grid size-6 place-items-center rounded-full text-muted-foreground opacity-60 transition hover:bg-white/10 hover:text-foreground hover:opacity-100"
                      aria-label={`Remove ${p.nickname}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-5">
        <div className="card flex flex-col items-center gap-4 p-6">
          <div className="rounded-2xl bg-ink p-4">
            <QRCodeSVG value={joinUrl} size={196} bgColor="#eff0f1" fgColor="#18191b" level="M" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Scan to join on a phone</p>
          <Button variant="outline" size="sm" onClick={copy} className="w-full">
            {copied ? <Check /> : <Copy />}
            {copied ? "Link copied" : "Copy join link"}
          </Button>
        </div>

        <div className="card p-6">
          <p className="t-eyebrow mb-2">Quiz</p>
          <p className="mb-1 text-xl leading-tight font-medium">{quiz.name}</p>
          <p className="mb-5 text-sm text-muted-foreground">
            {quiz.questions.length} questions
            {quiz.social_bonus_points > 0 && ` · ${quiz.social_bonus_points} bonus points for sharing`}
          </p>
          {!ready && (
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Loading images</span>
                <span className="font-mono tabular">
                  {loaded.done}/{loaded.total}
                </span>
              </div>
              <Progress value={(loaded.done / loaded.total) * 100} className="h-1.5" />
            </div>
          )}
          <Button
            size="xl"
            className="w-full"
            disabled={!participants.length || starting}
            onClick={async () => {
              setStarting(true);
              await onStart();
              setStarting(false);
            }}
          >
            {starting ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
            Start game
          </Button>
          {!participants.length && <p className="mt-3 text-center text-sm text-muted-foreground">At least one player needs to join.</p>}
        </div>
      </aside>
    </div>
  );
}
