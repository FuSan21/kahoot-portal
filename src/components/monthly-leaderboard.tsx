"use client";

import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerAvatar } from "@/components/user-menu";
import type { LeaderboardRow } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const TIME_ZONE = "Asia/Dhaka";

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month, 1));
}

/** Month boundaries in Dhaka time (UTC+6, no DST). */
function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1) - 6 * 3600_000);
  const end = new Date(Date.UTC(year, month + 1, 1) - 6 * 3600_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en", { year: "numeric", month: "numeric", timeZone: TIME_ZONE }).formatToParts(new Date());
  return { year: Number(parts.find((p) => p.type === "year")!.value), month: Number(parts.find((p) => p.type === "month")!.value) - 1 };
}

export function MonthlyLeaderboard({ viewerId }: { viewerId: string }) {
  const [cursor, setCursor] = useState(currentMonth);
  const [result, setResult] = useState<{ key: string; rows: LeaderboardRow[] } | null>(null);
  const now = currentMonth();
  const isCurrent = cursor.year === now.year && cursor.month === now.month;
  const key = `${cursor.year}-${cursor.month}`;

  useEffect(() => {
    let cancelled = false;
    const { start, end } = monthRange(cursor.year, cursor.month);
    void createClient()
      .rpc("get_monthly_leaderboard", { _start: start, _end: end })
      .then(({ data }) => !cancelled && setResult({ key, rows: data ?? [] }));
    return () => {
      cancelled = true;
    };
  }, [cursor, key]);

  const rows = result?.key === key ? result.rows : null;
  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });

  const top = rows?.slice(0, 10) ?? [];
  const me = rows?.find((r) => r.user_id === viewerId);
  const meHidden = me && !top.includes(me);

  return (
    <section className="card p-5 sm:p-7" aria-labelledby="monthly-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="t-eyebrow mb-2">Monthly leaderboard</p>
          <h2 id="monthly-heading" className="text-2xl">
            {monthLabel(cursor.year, cursor.month)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          {!isCurrent && (
            <Button variant="ghost" size="sm" onClick={() => setCursor(currentMonth())}>
              Today
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} disabled={isCurrent} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
      </div>

      {!rows ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No games were played this month yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {top.map((r, i) => (
            <LeaderRow key={r.user_id} row={r} index={i} self={r.user_id === viewerId} />
          ))}
          {meHidden && (
            <>
              <li aria-hidden className="text-center text-muted-foreground">
                ···
              </li>
              <LeaderRow row={me} index={10} self />
            </>
          )}
        </ol>
      )}
    </section>
  );
}

function LeaderRow({ row, index, self }: { row: LeaderboardRow; index: number; self: boolean }) {
  const rank = Number(row.rank);
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.03 }}
      className={cn("flex items-center gap-4 rounded-2xl px-3 py-2.5", self ? "bg-primary/10 ring-1 ring-primary/60" : "bg-surface-2/50")}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full font-mono text-sm tabular",
          rank === 1 && "bg-sun text-[#1f1700]",
          rank === 2 && "bg-sky text-[#0b1a26]",
          rank === 3 && "bg-ember text-[#18191b]",
          rank > 3 && "text-muted-foreground",
        )}
      >
        {rank === 1 ? <Crown className="size-4" /> : rank}
      </span>
      <PlayerAvatar name={row.full_name} src={row.avatar_url} className="size-9" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {row.full_name ?? "Player"}
          {self && <span className="text-muted-foreground"> · you</span>}
        </span>
        <span className="text-xs text-muted-foreground">
          {Number(row.games_played)} {Number(row.games_played) === 1 ? "game" : "games"}
        </span>
      </span>
      <span className="font-mono text-lg font-medium tabular">{Number(row.total_score).toLocaleString()}</span>
    </motion.li>
  );
}
