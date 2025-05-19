"use client";

import { Crown } from "lucide-react";
import { motion } from "motion/react";
import { PlayerAvatar } from "@/components/user-menu";
import type { GameResult } from "@/lib/game";
import { cn } from "@/lib/utils";

/** Ranked list of players; rows slide into their new place as scores change. */
export function Standings({
  results,
  highlightId,
  limit,
  className,
}: {
  results: GameResult[];
  highlightId?: string;
  limit?: number;
  className?: string;
}) {
  const shown = limit ? results.slice(0, limit) : results;
  const self = highlightId ? results.find((r) => r.participant_id === highlightId) : undefined;
  const selfHidden = self && !shown.includes(self);

  return (
    <ol className={cn("flex flex-col gap-2", className)}>
      {shown.map((r, i) => (
        <Row key={r.participant_id} result={r} index={i} highlight={r.participant_id === highlightId} />
      ))}
      {selfHidden && (
        <>
          <li aria-hidden className="py-1 text-center text-muted-foreground">
            ···
          </li>
          <Row result={self} index={shown.length} highlight />
        </>
      )}
    </ol>
  );
}

function Row({ result, index, highlight }: { result: GameResult; index: number; highlight: boolean }) {
  const rank = Number(result.rank);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3",
        highlight && "border-primary/70 bg-primary/10",
      )}
    >
      <span className={cn("w-7 text-center font-mono text-lg tabular", rank === 1 ? "text-sun" : "text-muted-foreground")}>
        {rank === 1 ? <Crown className="mx-auto size-5" /> : rank}
      </span>
      <PlayerAvatar name={result.nickname} src={result.avatar_url} className="size-9" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{result.nickname}</span>
        <span className="block text-xs text-muted-foreground">
          {Number(result.correct_count)} correct
          {Number(result.bonus_score) > 0 && ` · +${result.bonus_score} bonus`}
        </span>
      </span>
      <span className="font-mono text-lg font-medium tabular">{Number(result.total_score).toLocaleString()}</span>
    </motion.li>
  );
}
