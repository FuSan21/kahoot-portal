import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";
import { QuizCard } from "@/components/quiz/quiz-card";
import { Button } from "@/components/ui/button";
import { listQuizzes } from "@/lib/quizzes";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const filter = params.filter === "mine" ? "mine" : "all";
  const all = await listQuizzes({ viewerId: viewer!.id });
  const quizzes = filter === "mine" ? all.filter((q) => q.mine) : all;

  return (
    <div className="pt-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="t-eyebrow mb-3">Library</p>
          <h1 className="t-title">Pick a quiz, open a lobby.</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/create">
            <Plus /> New quiz
          </Link>
        </Button>
      </div>

      <div className="mb-8 inline-flex rounded-full border border-line bg-surface p-1" role="tablist">
        {(["all", "mine"] as const).map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/library" : "/library?filter=mine"}
            role="tab"
            aria-selected={filter === f}
            className={cn(
              "rounded-full px-5 py-2 text-sm transition-colors duration-200",
              filter === f ? "bg-ink text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? `All quizzes · ${all.length}` : `Mine · ${all.filter((q) => q.mine).length}`}
          </Link>
        ))}
      </div>

      {quizzes.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, i) => (
            <QuizCard key={quiz.id} quiz={quiz} index={i} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="card grid place-items-center gap-4 px-6 py-20 text-center">
          <h2 className="text-2xl">You have not made a quiz yet</h2>
          <p className="max-w-sm text-muted-foreground">Write a few questions, mark the right answers and host it in minutes.</p>
          <Button asChild>
            <Link href="/create">
              <Plus /> Create a quiz
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
