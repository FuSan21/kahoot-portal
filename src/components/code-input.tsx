"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Six-digit code entry drawn as separate cells over one real input. */
export function CodeInput({
  value,
  onChange,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const cells = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  return (
    <div className="group relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        id="game-code"
        name="code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-label="Game code"
        className="absolute inset-0 z-10 w-full cursor-text opacity-0"
      />
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_8px_repeat(3,minmax(0,1fr))] gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_16px_repeat(3,minmax(0,1fr))] sm:gap-3" aria-hidden>
        {cells.map((digit, i) => {
          const active = i === Math.min(value.length, 5);
          return [
            i === 3 && <span key="gap" />,
            <div
              key={i}
              className={cn(
                "grid aspect-[4/5] place-items-center rounded-2xl border-2 bg-surface font-mono text-4xl font-medium tabular transition-colors duration-150 sm:text-5xl",
                digit ? "border-[var(--p-line-strong)]" : "border-line",
                active && "group-focus-within:border-primary",
                invalid && "border-ember",
              )}
            >
              {digit || <span className="size-2 rounded-full bg-muted-foreground/30" />}
            </div>,
          ];
        })}
      </div>
    </div>
  );
}
