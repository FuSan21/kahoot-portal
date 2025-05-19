"use client";

import { cn } from "@/lib/utils";

/** A ring that drains as time runs out; turns ember in the last five seconds. */
export function CountdownRing({
  remainingMs,
  totalMs,
  size = 96,
  className,
}: {
  remainingMs: number;
  totalMs: number;
  size?: number;
  className?: string;
}) {
  const stroke = Math.max(6, size / 12);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = totalMs ? remainingMs / totalMs : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= 5 && remainingMs > 0;

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${seconds} seconds left`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--p-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={urgent ? "var(--a-ember)" : "var(--p-ink)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 200ms linear, stroke 200ms" }}
        />
      </svg>
      <span
        className={cn("absolute font-mono font-medium tabular", urgent && "text-ember")}
        style={{ fontSize: size * 0.34 }}
      >
        {seconds}
      </span>
    </div>
  );
}
