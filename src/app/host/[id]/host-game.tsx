"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { GameLoading, GameMessage, GameShell } from "@/components/game/game-shell";
import { useLiveGame, useParticipants } from "@/hooks/use-live-game";
import type { Game } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import { HostLobby } from "./host-lobby";
import { HostQuestion } from "./host-question";
import { HostResults } from "./host-results";

export function HostGame({ gameId }: { gameId: string }) {
  const { game, setGame, quiz, question, error } = useLiveGame(gameId);
  const participants = useParticipants(gameId);
  const startingRef = useRef<string | null>(null);

  const update = useCallback(
    async (patch: Partial<Game>) => {
      const { data, error } = await createClient().from("games").update(patch).eq("id", gameId).select().single();
      if (error) toast.error("The game could not be updated", { description: error.message });
      else setGame(data);
    },
    [gameId, setGame],
  );

  // Open each question as soon as it is on screen; the database stamps the real start time.
  useEffect(() => {
    if (!game || !question || game.phase !== "quiz") return;
    if (game.current_question_start_time || game.is_answer_revealed) return;
    if (startingRef.current === question.id) return;
    startingRef.current = question.id;
    void update({ current_question_start_time: new Date().toISOString() });
  }, [game, question, update]);

  if (error) return <GameMessage title="Game not found" body={error} />;
  if (!game || !quiz) return <GameLoading />;

  const total = quiz.questions.length;
  const isLast = game.current_question_sequence >= total - 1;

  return (
    <GameShell code={game.phase === "quiz" ? game.code : undefined} title={quiz.name}>
      <AnimatePresence mode="wait">
        <motion.div
          key={game.phase === "quiz" ? `q-${game.current_question_sequence}` : game.phase}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {game.phase === "lobby" && (
            <HostLobby
              game={game}
              quiz={quiz}
              participants={participants}
              onStart={() =>
                update({ phase: "quiz", current_question_sequence: 0, is_answer_revealed: false, current_question_start_time: null })
              }
            />
          )}
          {game.phase === "quiz" && question && (
            <HostQuestion
              game={game}
              quiz={quiz}
              question={question}
              participants={participants}
              isLast={isLast}
              onReveal={() => update({ is_answer_revealed: true })}
              onNext={() =>
                isLast
                  ? update({ phase: "result" })
                  : update({
                      current_question_sequence: game.current_question_sequence + 1,
                      is_answer_revealed: false,
                      current_question_start_time: null,
                    })
              }
            />
          )}
          {game.phase === "result" && <HostResults game={game} quiz={quiz} />}
        </motion.div>
      </AnimatePresence>
    </GameShell>
  );
}
