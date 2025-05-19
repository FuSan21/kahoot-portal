"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { celebrate } from "@/components/game/game-shell";
import { Podium } from "@/components/game/podium";
import { Standings } from "@/components/game/standings";
import { SocialBonusSubmit } from "@/components/social-bonus";
import { Button } from "@/components/ui/button";
import { fetchResults } from "@/hooks/use-live-game";
import type { Game, GameResult, Participant, QuizWithQuestions } from "@/lib/game";

export function PlayerResults({ game, quiz, participant }: { game: Game; quiz: QuizWithQuestions; participant: Participant }) {
  const [results, setResults] = useState<GameResult[] | null>(null);
  const load = useCallback(() => fetchResults(game.id).then(setResults), [game.id]);
  const me = results?.find((r) => r.participant_id === participant.id);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (me && Number(me.rank) <= 3) window.setTimeout(celebrate, 900);
  }, [me?.participant_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pt-4 pb-16 sm:px-8">
      {me && (
        <motion.div className="text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="t-eyebrow mb-3">You finished</p>
          <p className="t-hero text-primary">
            {Number(me.rank)}
            <span className="text-[0.45em] align-super">{suffix(Number(me.rank))}</span>
          </p>
          <p className="mt-3 text-lg text-muted-foreground">
            {Number(me.total_score).toLocaleString()} points · {Number(me.correct_count)} of {quiz.questions.length} correct
          </p>
        </motion.div>
      )}

      {results && <Podium results={results} />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <h2 className="mb-4 text-2xl">Standings</h2>
          {results && <Standings results={results} highlightId={participant.id} limit={10} />}
        </section>
        <aside className="flex flex-col gap-6">
          {quiz.social_bonus_points > 0 && (
            <SocialBonusSubmit
              gameId={game.id}
              participantId={participant.id}
              points={quiz.social_bonus_points}
              shareLink={quiz.social_share_link}
              onApproved={load}
            />
          )}
          <div className="card flex flex-col gap-3 p-6">
            <h2 className="text-xl">What next?</h2>
            <p className="text-[15px] text-muted-foreground">Every game this month counts toward the monthly leaderboard.</p>
            <Button asChild size="lg">
              <Link href="/history">
                Monthly leaderboard <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Join another game</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function suffix(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
}
