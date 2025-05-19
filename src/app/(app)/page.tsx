import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AnswerMosaic } from "@/components/answer-mosaic";
import { QuizCard } from "@/components/quiz/quiz-card";
import { listQuizzes } from "@/lib/quizzes";
import { getViewer } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

export default async function JoinPage({ searchParams }: PageProps<"/">) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const quizzes = await listQuizzes({ limit: 3, viewerId: viewer!.id });
  const code = typeof params.code === "string" ? params.code.replace(/\D/g, "").slice(0, 6) : "";

  return (
    <>
      <section className="grid min-h-[calc(100dvh-72px)] items-center gap-12 py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="t-eyebrow mb-5">Hi {viewer!.name.split(" ")[0]}, ready to play?</p>
          <h1 className="t-hero mb-10">
            Join a live quiz <span className="text-primary">with a code.</span>
          </h1>
          <JoinForm initialCode={code} />
        </div>
        <AnswerMosaic className="hidden lg:block" />
      </section>

      <section className="border-t border-line pt-16" aria-labelledby="host-heading">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="t-eyebrow mb-3">Host</p>
            <h2 id="host-heading" className="t-title">
              Quizzes ready to host
            </h2>
          </div>
          <Link href="/library" className="link flex items-center gap-2 text-[15px]">
            Browse the library <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, i) => (
            <QuizCard key={quiz.id} quiz={quiz} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
