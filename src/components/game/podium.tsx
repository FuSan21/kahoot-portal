"use client";

import { motion } from "motion/react";
import { PlayerAvatar } from "@/components/user-menu";
import type { GameResult } from "@/lib/game";
import { cn } from "@/lib/utils";

const PLACES = [
  { order: 1, height: "h-44 sm:h-56", tone: "bg-sun text-[#1f1700]", delay: 0.9, label: "1st" },
  { order: 0, height: "h-32 sm:h-40", tone: "bg-sky text-[#0b1a26]", delay: 0.5, label: "2nd" },
  { order: 2, height: "h-24 sm:h-28", tone: "bg-ember text-[#18191b]", delay: 0.2, label: "3rd" },
];

/** Top three, revealed third → second → first. */
export function Podium({ results, className }: { results: GameResult[]; className?: string }) {
  const top = results.slice(0, 3);
  if (!top.length) return null;

  return (
    <div className={cn("flex items-end justify-center gap-3 sm:gap-5", className)}>
      {[1, 0, 2].map((place) => {
        const r = top[place];
        const meta = PLACES[place]!;
        if (!r) return <div key={place} className="w-28 sm:w-40" />;
        return (
          <motion.div
            key={r.participant_id}
            className="flex w-28 flex-col items-center sm:w-40"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: meta.delay, type: "spring", stiffness: 260, damping: 24 }}
          >
            <PlayerAvatar name={r.nickname} src={r.avatar_url} className={cn("mb-3 ring-4 ring-background", place === 0 ? "size-20" : "size-14")} />
            <p className="mb-1 w-full truncate text-center font-medium">{r.nickname}</p>
            <p className="mb-3 font-mono text-sm text-muted-foreground tabular">{Number(r.total_score).toLocaleString()}</p>
            <motion.div
              className={cn("flex w-full origin-bottom items-start justify-center rounded-t-3xl pt-4", meta.height, meta.tone)}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: meta.delay, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="text-3xl font-medium tracking-tight sm:text-4xl">{meta.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
