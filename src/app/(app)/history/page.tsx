import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MonthlyLeaderboard } from "@/components/monthly-leaderboard";
import { quizImageUrl } from "@/lib/game";
import { createClient, getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "History" };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

export default async function HistoryPage() {
  const viewer = (await getViewer())!;
  const supabase = await createClient();
  const { data: history } = await supabase.rpc("get_my_history");
  const games = history ?? [];

  return (
    <div className="pt-14">
      <div className="mb-10">
        <p className="t-eyebrow mb-3">History</p>
        <h1 className="t-title">Your games and this month&rsquo;s best.</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section aria-labelledby="games-heading">
          <h2 id="games-heading" className="mb-4 text-2xl">
            Games <span className="font-mono text-base text-muted-foreground tabular">{games.length}</span>
          </h2>
          {games.length === 0 ? (
            <div className="card px-6 py-16 text-center text-muted-foreground">
              Games you play or host show up here.{" "}
              <Link href="/" className="link text-foreground">
                Join one with a code
              </Link>
              .
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {games.map((g) => {
                const cover = quizImageUrl(g.quiz_set_id, g.quiz_image);
                const href = g.role === "host" ? `/host/${g.game_id}` : `/game/${g.game_id}`;
                return (
                  <li key={`${g.game_id}-${g.role}`}>
                    <Link href={href} className="card group flex items-center gap-4 p-3 pr-5">
                      <div className="zoom relative size-16 shrink-0 rounded-xl bg-surface-2 sm:size-20">
                        {cover && <Image src={cover} alt="" fill sizes="80px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-medium">{g.quiz_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dateFormat.format(new Date(g.played_at))} · {Number(g.player_count)}{" "}
                          {Number(g.player_count) === 1 ? "player" : "players"}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        {g.role === "host" ? (
                          <span className="rounded-full border border-line px-3 py-1 text-xs">Hosted</span>
                        ) : g.my_rank ? (
                          <>
                            <p className={cn("font-mono text-lg font-medium tabular", Number(g.my_rank) === 1 && "text-sun")}>
                              #{Number(g.my_rank)}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground tabular">{Number(g.my_score).toLocaleString()} pts</p>
                          </>
                        ) : null}
                        {g.phase !== "result" && <p className="mt-1 text-xs text-mint">Live</p>}
                      </div>
                      <ArrowUpRight className="size-5 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <MonthlyLeaderboard viewerId={viewer.id} />
      </div>
    </div>
  );
}
