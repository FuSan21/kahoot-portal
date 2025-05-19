"use client";

import { Library, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { celebrate } from "@/components/game/game-shell";
import { Podium } from "@/components/game/podium";
import { Standings } from "@/components/game/standings";
import { HostButton } from "@/components/quiz/host-button";
import { SocialBonusReview } from "@/components/social-bonus";
import { Button } from "@/components/ui/button";
import { fetchResults } from "@/hooks/use-live-game";
import type { Game, GameResult, QuizWithQuestions } from "@/lib/game";

export function HostResults({ game, quiz }: { game: Game; quiz: QuizWithQuestions }) {
  const [results, setResults] = useState<GameResult[] | null>(null);

  const load = useCallback(() => fetchResults(game.id).then(setResults), [game.id]);

  useEffect(() => {
    void load().then(() => window.setTimeout(celebrate, 1100));
  }, [load]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 pt-4 pb-16 sm:px-8">
      <div className="text-center">
        <p className="t-eyebrow mb-3">Final results</p>
        <h1 className="t-title">{results?.[0] ? `${results[0].nickname} takes it.` : "That's a wrap."}</h1>
      </div>

      {results && <Podium results={results} />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section>
          <h2 className="mb-4 text-2xl">Standings</h2>
          {results && results.length > 0 ? (
            <Standings results={results} />
          ) : (
            <p className="text-muted-foreground">Nobody answered a question in this game.</p>
          )}
        </section>
        <aside className="flex flex-col gap-6">
          {quiz.social_bonus_points > 0 && <SocialBonusReview gameId={game.id} points={quiz.social_bonus_points} onChange={load} />}
          <div className="card flex flex-col gap-3 p-6">
            <h2 className="mb-1 text-xl">Play again?</h2>
            <HostButton quizSetId={quiz.id} size="lg" className="w-full" />
            <Button asChild variant="outline" size="lg">
              <Link href="/library">
                <Library /> Back to the library
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/history">
                <RotateCcw /> Game history
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
