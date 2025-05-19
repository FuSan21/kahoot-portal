"use client";

import { LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameLoading, GameMessage, GameShell } from "@/components/game/game-shell";
import { Button } from "@/components/ui/button";
import { useLiveGame, useParticipants } from "@/hooks/use-live-game";
import type { Participant } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import type { Viewer } from "@/lib/supabase/server";
import { PlayerLobby } from "./player-lobby";
import { PlayerQuestion } from "./player-question";
import { PlayerResults } from "./player-results";

type Seat = { status: "loading" } | { status: "joined"; participant: Participant } | { status: "late" } | { status: "removed" };

export function PlayerGame({ gameId, viewer }: { gameId: string; viewer: Viewer }) {
  const router = useRouter();
  const { game, quiz, question, error } = useLiveGame(gameId);
  const participants = useParticipants(gameId);
  const [seat, setSeat] = useState<Seat>({ status: "loading" });
  const phase = game?.phase;

  // Find or take this player's seat. Players can rejoin mid-game; only the lobby admits new ones.
  useEffect(() => {
    if (!phase || seat.status !== "loading") return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("participants")
        .select("*")
        .eq("game_id", gameId)
        .eq("user_id", viewer.id)
        .maybeSingle();
      if (cancelled) return;
      if (existing) return setSeat({ status: "joined", participant: existing });
      if (phase !== "lobby") return setSeat({ status: "late" });
      const { data, error } = await supabase
        .from("participants")
        .insert({ game_id: gameId, nickname: viewer.name.slice(0, 40) })
        .select()
        .single();
      if (!cancelled) setSeat(error || !data ? { status: "late" } : { status: "joined", participant: data });
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, seat.status, gameId, viewer]);

  // The host removed this player.
  const seatId = seat.status === "joined" ? seat.participant.id : null;
  const seated = seatId ? participants.some((p) => p.id === seatId) : true;
  const [wasSeated, setWasSeated] = useState(false);
  if (seated && seatId && participants.length && !wasSeated) setWasSeated(true);
  const removed = wasSeated && !seated;

  async function leave() {
    if (seatId && phase === "lobby") await createClient().from("participants").delete().eq("id", seatId);
    router.push("/");
  }

  if (error) return <GameMessage title="Game not found" body={error} />;
  if (removed) return <GameMessage title="You were removed" body="The host took you out of this lobby. Ask them for a new code if that was a mistake." />;
  if (seat.status === "late")
    return <GameMessage title="This game has started" body="New players can only join while the host is in the lobby. Ask for the next code." />;
  if (!game || !quiz || seat.status !== "joined") return <GameLoading label="Joining game" />;

  const participant = seat.participant;

  return (
    <GameShell
      code={game.phase === "lobby" ? game.code : undefined}
      title={quiz.name}
      right={
        game.phase !== "result" && (
          <Button variant="ghost" size="sm" onClick={leave}>
            <LogOut /> Leave
          </Button>
        )
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={game.phase === "quiz" ? `q-${game.current_question_sequence}` : game.phase}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {game.phase === "lobby" && <PlayerLobby participant={participant} participants={participants} viewer={viewer} />}
          {game.phase === "quiz" && question && (
            <PlayerQuestion game={game} quiz={quiz} question={question} participant={participant} />
          )}
          {game.phase === "result" && <PlayerResults game={game} quiz={quiz} participant={participant} />}
        </motion.div>
      </AnimatePresence>
    </GameShell>
  );
}
