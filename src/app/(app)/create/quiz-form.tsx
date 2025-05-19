"use client";

import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePicker } from "@/components/quiz/image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ANSWER_LETTERS, ANSWER_TONES } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type DraftQuestion = {
  key: string;
  body: string;
  timeLimit: number;
  image: File | null;
  choices: string[];
  correct: number;
};

const TIME_LIMITS = [10, 20, 30, 60];

function newQuestion(): DraftQuestion {
  return { key: crypto.randomUUID(), body: "", timeLimit: 20, image: null, choices: ["", "", "", ""], correct: 0 };
}

function ext(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "jpg";
}

export function QuizForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [bonus, setBonus] = useState(0);
  const [shareLink, setShareLink] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [newQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const patch = (key: string, change: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...change } : q)));

  const move = (index: number, delta: number) =>
    setQuestions((qs) => {
      const next = [...qs];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item!);
      return next;
    });

  const problems = [
    !name.trim() && "Give the quiz a name.",
    ...questions.flatMap((q, i) => [
      !q.body.trim() && `Question ${i + 1} needs text.`,
      q.choices.filter((c) => c.trim()).length < 2 && `Question ${i + 1} needs at least two choices.`,
      !q.choices[q.correct]?.trim() && `Question ${i + 1}: the correct choice is empty.`,
    ]),
  ].filter((p): p is string => Boolean(p));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (problems.length) {
      setShowErrors(true);
      toast.error(problems[0]);
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const coverName = cover ? `cover.${ext(cover)}` : null;

    const payload = {
      id,
      name: name.trim(),
      description: description.trim(),
      is_public: isPublic,
      social_bonus_points: bonus,
      social_share_link: shareLink.trim(),
      image: coverName,
      questions: questions.map((q, i) => {
        const filled = q.choices.map((body, ci) => ({ body: body.trim(), is_correct: ci === q.correct })).filter((c) => c.body);
        return { body: q.body.trim(), time_limit: q.timeLimit, image: q.image ? `q${i}.${ext(q.image)}` : null, choices: filled };
      }),
    };

    const { error } = await supabase.rpc("create_quiz", { payload });
    if (error) {
      setSubmitting(false);
      toast.error("The quiz could not be saved", { description: error.message });
      return;
    }

    const uploads = [
      cover && coverName ? { path: `${id}/${coverName}`, file: cover } : null,
      ...questions.map((q, i) => (q.image ? { path: `${id}/q${i}.${ext(q.image)}`, file: q.image } : null)),
    ].filter((u): u is { path: string; file: File } => Boolean(u));
    const failed = (
      await Promise.all(uploads.map((u) => supabase.storage.from("quiz_images").upload(u.path, u.file, { contentType: u.file.type, upsert: true })))
    ).filter((r) => r.error).length;

    if (failed) toast.warning(`Quiz saved, but ${failed} image${failed > 1 ? "s" : ""} did not upload.`);
    else toast.success("Quiz saved. Host it whenever you like.");
    router.push("/library?filter=mine");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]" noValidate>
      <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
        <div className="card flex flex-col gap-5 p-6">
          <ImagePicker file={cover} onChange={setCover} label="Cover image" className="aspect-[16/10]" />
          <div className="grid gap-2">
            <Label htmlFor="quiz-name">Name</Label>
            <Input
              id="quiz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday office trivia"
              maxLength={120}
              aria-invalid={showErrors && !name.trim()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quiz-description">Description</Label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What the quiz is about"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-2/50 p-4">
            <div>
              <Label htmlFor="quiz-public">Show in the library</Label>
              <p className="mt-1 text-xs text-muted-foreground">Anyone signed in can host it.</p>
            </div>
            <Switch id="quiz-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quiz-bonus">Share bonus points</Label>
            <Input
              id="quiz-bonus"
              type="number"
              min={0}
              max={5000}
              step={50}
              value={bonus}
              onChange={(e) => setBonus(Math.max(0, Math.min(5000, Number(e.target.value) || 0)))}
            />
            <p className="text-xs text-muted-foreground">Players earn these after the host approves a screenshot of their share. 0 turns it off.</p>
          </div>
          {bonus > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="quiz-share">Link to share</Label>
              <Input id="quiz-share" type="url" value={shareLink} onChange={(e) => setShareLink(e.target.value)} placeholder="https://" />
            </div>
          )}
        </div>
        <Button type="submit" size="xl" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Check />}
          Save quiz · {questions.length} {questions.length === 1 ? "question" : "questions"}
        </Button>
      </aside>

      <div className="flex flex-col gap-5">
        <AnimatePresence initial={false}>
          {questions.map((q, i) => (
            <motion.section
              key={q.key}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="card p-5 sm:p-7"
              aria-label={`Question ${i + 1}`}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-ink font-mono text-sm text-background">{i + 1}</span>
                <span className="t-eyebrow">Question</span>
                <div className="ml-auto flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === questions.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={questions.length === 1}
                    onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
                    aria-label="Delete question"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
                <Textarea
                  value={q.body}
                  onChange={(e) => patch(q.key, { body: e.target.value })}
                  placeholder="Type your question"
                  className="min-h-28 text-xl md:text-xl"
                  aria-label={`Question ${i + 1} text`}
                  aria-invalid={showErrors && !q.body.trim()}
                />
                <ImagePicker file={q.image} onChange={(image) => patch(q.key, { image })} label="Image (optional)" className="min-h-28" />
              </div>

              <fieldset className="mb-5 grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Choices. Pick the correct one.</legend>
                {q.choices.map((choice, ci) => {
                  const correct = q.correct === ci;
                  return (
                    <div
                      key={ci}
                      className={cn(
                        `tile-${ANSWER_TONES[ci]}`,
                        "flex items-center gap-3 rounded-2xl border-2 bg-surface-2/50 p-2 pl-3 transition-colors",
                        correct ? "border-[var(--tile)]" : "border-transparent",
                      )}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--tile)] font-mono text-sm text-[var(--tile-ink)]">
                        {ANSWER_LETTERS[ci]}
                      </span>
                      <input
                        value={choice}
                        onChange={(e) => patch(q.key, { choices: q.choices.map((c, k) => (k === ci ? e.target.value : c)) })}
                        placeholder={ci < 2 ? `Choice ${ANSWER_LETTERS[ci]}` : `Choice ${ANSWER_LETTERS[ci]} (optional)`}
                        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                        aria-label={`Question ${i + 1} choice ${ANSWER_LETTERS[ci]}`}
                      />
                      <button
                        type="button"
                        onClick={() => patch(q.key, { correct: ci })}
                        aria-pressed={correct}
                        aria-label={`Mark ${ANSWER_LETTERS[ci]} correct`}
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors",
                          correct ? "border-[var(--tile)] bg-[var(--tile)] text-[var(--tile-ink)]" : "border-line text-transparent hover:border-[var(--p-muted)]",
                        )}
                      >
                        <Check className="size-4" strokeWidth={3} />
                      </button>
                    </div>
                  );
                })}
              </fieldset>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-sm text-muted-foreground">Time to answer</span>
                {TIME_LIMITS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => patch(q.key, { timeLimit: t })}
                    aria-pressed={q.timeLimit === t}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 font-mono text-sm tabular transition-colors",
                      q.timeLimit === t ? "bg-ink text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>

        <Button type="button" variant="outline" size="xl" className="border-dashed" onClick={() => setQuestions((qs) => [...qs, newQuestion()])}>
          <Plus /> Add question
        </Button>
      </div>
    </form>
  );
}
