"use client";

import { Check, Lock, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnswerTile, type TileState } from "@/components/game/answer-tile";
import { QuestionImage } from "@/components/game/game-shell";
import { fetchResults, useReveal } from "@/hooks/use-live-game";
import { useTicker } from "@/hooks/use-server-clock";
import {
  ANSWER_LETTERS,
  ANSWER_TONES,
  CHOICE_REVEAL_DELAY_MS,
  remainingMs,
  type Answer,
  type Game,
  type Participant,
  type Question,
  type QuizWithQuestions,
} from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function PlayerQuestion({
  game,
  quiz,
  question,
  participant,
}: {
  game: Game;
  quiz: QuizWithQuestions;
  question: Question;
  participant: Participant;
}) {
  const revealed = game.is_answer_revealed;
  const started = Boolean(game.current_question_start_time);
  const now = useTicker(started && !revealed, 100);
  const startMs = game.current_question_start_time ? new Date(game.current_question_start_time).getTime() : null;
  const open = startMs !== null && now >= startMs + CHOICE_REVEAL_DELAY_MS;
  const left = remainingMs(game.current_question_start_time, question.time_limit, now);

  const [picked, setPicked] = useState<string | null>(null);
  const [mine, setMine] = useState<Answer | null>(null);
  const [rank, setRank] = useState<{ rank: number; total: number; score: number } | null>(null);
  const reveal = useReveal(game.id, question.id, revealed);

  // Restore an answer already given (after a refresh), and read the score once revealed.
  useEffect(() => {
    let cancelled = false;
    void createClient()
      .from("answers")
      .select("*")
      .eq("participant_id", participant.id)
      .eq("question_id", question.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setMine(data);
        setPicked(data.choice_id);
      });
    return () => {
      cancelled = true;
    };
  }, [participant.id, question.id, revealed]);

  useEffect(() => {
    if (!revealed) return;
    let cancelled = false;
    void fetchResults(game.id).then((rows) => {
      const me = rows.find((r) => r.participant_id === participant.id);
      if (!cancelled && me) setRank({ rank: Number(me.rank), total: rows.length, score: Number(me.total_score) });
    });
    return () => {
      cancelled = true;
    };
  }, [revealed, game.id, participant.id]);

  async function answer(choiceId: string) {
    if (picked || !open || left <= 0) return;
    setPicked(choiceId);
    navigator.vibrate?.(20);
    const { error } = await createClient()
      .from("answers")
      .insert({ participant_id: participant.id, question_id: question.id, choice_id: choiceId, game_id: game.id });
    if (error) {
      if (error.code !== "23505") setPicked(null);
      toast.error(error.message.includes("time") || error.message.includes("open") ? "Too late for this one" : "Your answer did not go through");
    }
  }

  if (revealed) {
    const correct = reveal?.correctId ? (mine?.choice_id ?? picked) === reveal.correctId : null;
    const correctIndex = question.choices.findIndex((c) => c.id === reveal?.correctId);
    const missed = !picked;
    return (
      <motion.div
        className={cn(
          "mx-4 mb-4 flex flex-1 flex-col items-center justify-center gap-6 rounded-[2rem] px-6 py-12 text-center sm:mx-8",
          correct === true && "bg-mint text-[#062417]",
          correct === false && "bg-ember text-[#18191b]",
          correct === null && "bg-surface",
        )}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {correct !== null && (
          <motion.span
            className="grid size-24 place-items-center rounded-full bg-black/15"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 18 }}
          >
            {correct ? <Check className="size-12" strokeWidth={3} /> : <X className="size-12" strokeWidth={3} />}
          </motion.span>
        )}
        <div>
          <h1 className="t-title mb-3">{correct === null ? "Checking…" : correct ? "Correct!" : missed ? "Out of time" : "Not this time"}</h1>
          {correct && mine && (
            <motion.p className="font-mono text-4xl font-medium tabular" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              +{mine.score}
            </motion.p>
          )}
          {correct === false && correctIndex >= 0 && (
            <p className="text-lg">
              The answer was <span className="font-medium">{ANSWER_LETTERS[correctIndex]}: {question.choices[correctIndex]?.body}</span>
            </p>
          )}
        </div>
        {rank && (
          <p className="rounded-full bg-black/15 px-5 py-2 text-[15px] font-medium">
            You are {ordinal(rank.rank)} of {rank.total} · {rank.score.toLocaleString()} pts
          </p>
        )}
      </motion.div>
    );
  }

  if (picked) {
    const index = question.choices.findIndex((c) => c.id === picked);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16 text-center">
        <motion.div
          className={cn(`tile-${ANSWER_TONES[index] ?? "ember"}`, "grid size-28 place-items-center rounded-[2rem] bg-[var(--tile)] font-mono text-5xl text-[var(--tile-ink)]")}
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
        >
          {ANSWER_LETTERS[index]}
        </motion.div>
        <div>
          <h1 className="t-title mb-2 flex items-center justify-center gap-3">
            <Lock className="size-7" /> Locked in
          </h1>
          <p className="text-lg text-muted-foreground">Faster correct answers score more. Waiting for the others…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 pb-6 sm:px-6">
      <div className="flex items-center justify-between">
        <span className="t-eyebrow">
          {game.current_question_sequence + 1} / {quiz.questions.length}
        </span>
        {open && <span className={cn("font-mono text-2xl tabular", left <= 5000 && "text-ember")}>{Math.ceil(left / 1000)}</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-100 ease-linear"
          style={{ width: open ? `${(left / (question.time_limit * 1000)) * 100}%` : "100%" }}
        />
      </div>
      <h1 className="text-[clamp(1.6rem,6vw,2.5rem)] leading-tight font-medium tracking-[-0.03em]">{question.body}</h1>
      {!open && question.image && <QuestionImage quizId={quiz.id} question={question} className="aspect-video w-full" />}
      {open ? (
        <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
          {question.choices.map((c, i) => (
            <AnswerTile
              key={c.id}
              index={i}
              body={c.body}
              size="xl"
              state={left <= 0 ? ("dim" as TileState) : "idle"}
              disabled={left <= 0}
              onSelect={() => answer(c.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-auto flex flex-col items-center gap-3 py-10 text-center">
          <motion.span
            key={startMs ?? 0}
            className="grid size-20 place-items-center rounded-full bg-primary font-mono text-3xl text-primary-foreground"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {startMs ? Math.max(1, Math.ceil((startMs + CHOICE_REVEAL_DELAY_MS - now) / 1000)) : "…"}
          </motion.span>
          <p className="text-muted-foreground">Get ready to answer</p>
        </div>
      )}
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}
