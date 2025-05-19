"use client";

import { motion } from "motion/react";
import { ANSWER_LETTERS, ANSWER_TONES } from "@/lib/game";
import { cn } from "@/lib/utils";

const SAMPLE = ["1971", "1947", "1952", "1991"];

/** A live-looking question card: the decorative centrepiece of the login and join screens. */
export function AnswerMosaic({ className, question = "When did Bangladesh gain independence?" }: { className?: string; question?: string }) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="card ground-grid relative overflow-hidden p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <span className="t-eyebrow">Question 1 of 10</span>
          <span className="flex items-center gap-2 font-mono text-sm tabular text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-ember" />
            </span>
            18s
          </span>
        </div>
        <p className="mb-6 text-2xl leading-tight font-medium tracking-tight sm:text-3xl">{question}</p>
        <div className="grid grid-cols-2 gap-3">
          {SAMPLE.map((body, i) => (
            <motion.div
              key={body}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className={cn(
                `tile-${ANSWER_TONES[i]}`,
                "flex items-center gap-3 rounded-2xl bg-[var(--tile)] p-3.5 text-[var(--tile-ink)] sm:p-4",
                i === 0 && "ring-4 ring-ink/90 ring-offset-4 ring-offset-surface",
              )}
            >
              <span className="grid size-8 place-items-center rounded-lg bg-black/15 font-mono text-sm font-medium">
                {ANSWER_LETTERS[i]}
              </span>
              <span className="text-lg font-medium">{body}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
