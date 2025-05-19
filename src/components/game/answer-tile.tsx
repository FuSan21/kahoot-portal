"use client";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { ANSWER_LETTERS, ANSWER_TONES } from "@/lib/game";
import { cn } from "@/lib/utils";

export type TileState = "idle" | "selected" | "correct" | "wrong" | "dim";

/** One answer option. Interactive on the player's phone, display-only on the host screen. */
export function AnswerTile({
  index,
  body,
  state = "idle",
  count,
  total,
  onSelect,
  disabled,
  size = "lg",
}: {
  index: number;
  body: string;
  state?: TileState;
  count?: number;
  total?: number;
  onSelect?: () => void;
  disabled?: boolean;
  size?: "lg" | "xl";
}) {
  const tone = ANSWER_TONES[index % 4];
  const interactive = Boolean(onSelect) && !disabled;
  const share = total ? (count ?? 0) / total : 0;
  const Comp = onSelect ? motion.button : motion.div;

  return (
    <Comp
      type={onSelect ? "button" : undefined}
      onClick={interactive ? onSelect : undefined}
      disabled={onSelect ? disabled : undefined}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{
        opacity: state === "dim" || state === "wrong" ? 0.38 : 1,
        y: 0,
        scale: state === "correct" || state === "selected" ? 1.02 : 1,
      }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 380, damping: 30 }}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      className={cn(
        `tile-${tone}`,
        "relative flex w-full items-center gap-4 overflow-hidden rounded-[1.4rem] bg-[var(--tile)] text-left text-[var(--tile-ink)]",
        size === "xl" ? "min-h-28 p-5 sm:min-h-36 sm:p-6" : "min-h-20 p-4 sm:p-5",
        interactive && "cursor-pointer hover:brightness-105 focus-visible:outline-offset-4",
        state === "correct" && "ring-4 ring-ink ring-offset-4 ring-offset-background",
        state === "selected" && "ring-4 ring-ink/90 ring-offset-4 ring-offset-background",
      )}
      aria-pressed={onSelect ? state === "selected" : undefined}
    >
      {count !== undefined && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-black/15"
          initial={{ width: 0 }}
          animate={{ width: `${share * 100}%` }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        />
      )}
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-xl bg-black/15 font-mono font-medium",
          size === "xl" ? "size-12 text-xl" : "size-10 text-base",
        )}
      >
        {state === "correct" ? <Check className="size-6" strokeWidth={3} /> : state === "wrong" ? <X className="size-6" strokeWidth={3} /> : ANSWER_LETTERS[index]}
      </span>
      <span className={cn("relative flex-1 leading-tight font-medium", size === "xl" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl")}>
        {body}
      </span>
      {count !== undefined && (
        <span className="relative font-mono text-2xl font-medium tabular">{count}</span>
      )}
    </Comp>
  );
}
