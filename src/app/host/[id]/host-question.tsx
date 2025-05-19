"use client";

import { ArrowRight, Eye, Loader2, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnswerTile } from "@/components/game/answer-tile";
import { CountdownRing } from "@/components/game/countdown-ring";
import { QuestionImage } from "@/components/game/game-shell";
import { Standings } from "@/components/game/standings";
import { Button } from "@/components/ui/button";
import { fetchResults, useQuestionAnswers, useReveal } from "@/hooks/use-live-game";
import { useTicker } from "@/hooks/use-server-clock";
import {
  CHOICE_REVEAL_DELAY_MS,
  remainingMs,
  type Game,
  type GameResult,
  type ParticipantWithProfile,
  type Question,
  type QuizWithQuestions,
} from "@/lib/game";
import { cn } from "@/lib/utils";

export function HostQuestion({
  game,
  quiz,
  question,
  participants,
  isLast,
  onReveal,
  onNext,
}: {
  game: Game;
  quiz: QuizWithQuestions;
  question: Question;
  participants: ParticipantWithProfile[];
  isLast: boolean;
  onReveal: () => Promise<void>;
  onNext: () => Promise<void>;
}) {
  const started = Boolean(game.current_question_start_time);
  const revealed = game.is_answer_revealed;
  const now = useTicker(started && !revealed);
  const left = remainingMs(game.current_question_start_time, question.time_limit, now);
  const startMs = game.current_question_start_time ? new Date(game.current_question_start_time).getTime() : null;
  const choicesOpen = startMs !== null && now >= startMs + CHOICE_REVEAL_DELAY_MS;
  const getReady = startMs === null ? 3 : Math.max(0, Math.ceil((startMs + CHOICE_REVEAL_DELAY_MS - now) / 1000));

  const answers = useQuestionAnswers(game.id, question.id);
  const playerIds = new Set(participants.map((p) => p.id));
  const answered = answers.filter((a) => playerIds.has(a.participant_id)).length;
  const reveal = useReveal(game.id, question.id, revealed);
  const [standings, setStandings] = useState<GameResult[]>([]);
  const [busy, setBusy] = useState(false);
  const revealedRef = useRef<string | null>(null);

  // Reveal when time runs out or everyone has answered.
  useEffect(() => {
    if (revealed || !choicesOpen || revealedRef.current === question.id) return;
    const everyone = participants.length > 0 && answered >= participants.length;
    if (left <= 0 || everyone) {
      revealedRef.current = question.id;
      void onReveal();
    }
  }, [revealed, choicesOpen, left, answered, participants.length, question.id, onReveal]);

  useEffect(() => {
    if (!revealed) return;
    let cancelled = false;
    void fetchResults(game.id).then((r) => !cancelled && setStandings(r));
    return () => {
      cancelled = true;
    };
  }, [revealed, game.id, question.id]);

  const total = quiz.questions.length;
  const withImage = Boolean(question.image);
  const totalAnswers = Object.values(reveal?.counts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-6 sm:px-8">
      <div className="flex items-center gap-4">
        <span className="t-eyebrow">
          Question {game.current_question_sequence + 1} of {total}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((game.current_question_sequence + (revealed ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <span className="font-mono text-sm text-muted-foreground tabular">
          {answered}/{participants.length} answered
        </span>
      </div>

      <div className="flex items-start justify-between gap-6">
        <motion.h1
          className="text-[clamp(2rem,4.2vw,3.75rem)] leading-[1.05] font-medium tracking-[-0.035em]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {question.body}
        </motion.h1>
        {revealed ? (
          <div className="grid size-[112px] shrink-0 place-items-center rounded-full border-4 border-mint text-center text-sm font-medium text-mint">
            Time&rsquo;s up
          </div>
        ) : choicesOpen ? (
          <CountdownRing remainingMs={left} totalMs={question.time_limit * 1000} size={112} />
        ) : (
          <motion.div
            key={getReady}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid size-[112px] shrink-0 place-items-center rounded-full bg-primary font-mono text-5xl font-medium text-primary-foreground"
          >
            {getReady}
          </motion.div>
        )}
      </div>

      <div
        className={cn(
          "grid flex-1 content-start gap-6",
          revealed ? "lg:grid-cols-[minmax(0,1fr)_380px]" : withImage && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
        )}
      >
        {withImage && !revealed && <QuestionImage quizId={quiz.id} question={question} className="aspect-video w-full lg:aspect-auto lg:h-full lg:min-h-72" />}
        <div className={cn("grid content-start gap-3", (revealed || !withImage) && "sm:grid-cols-2")}>
          {choicesOpen || revealed
            ? question.choices.map((c, i) => (
                <AnswerTile
                  key={c.id}
                  index={i}
                  body={c.body}
                  size={withImage && !revealed ? "lg" : "xl"}
                  state={reveal ? (c.id === reveal.correctId ? "correct" : "dim") : "idle"}
                  count={reveal ? (reveal.counts[c.id] ?? 0) : undefined}
                  total={totalAnswers}
                />
              ))
            : question.choices.map((c) => (
                <div
                  key={c.id}
                  className={cn("rounded-[1.4rem] border-2 border-dashed border-line", withImage ? "min-h-20" : "min-h-28 sm:min-h-36")}
                />
              ))}
        </div>
        {revealed && (
          <motion.section initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="t-eyebrow mb-3 flex items-center gap-2">
              <Trophy className="size-3.5" /> Top players
            </h2>
            <Standings results={standings} limit={5} />
          </motion.section>
        )}
      </div>

      <div className="flex justify-end">
        {revealed ? (
          <Button
            size="xl"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onNext();
              setBusy(false);
            }}
          >
            {busy && <Loader2 className="animate-spin" />}
            {isLast ? "Show final results" : "Next question"}
            {!busy && (isLast ? <Trophy /> : <ArrowRight />)}
          </Button>
        ) : (
          <Button size="lg" variant="outline" disabled={!choicesOpen} onClick={() => void onReveal()}>
            <Eye /> Reveal answer now
          </Button>
        )}
      </div>
    </div>
  );
}
