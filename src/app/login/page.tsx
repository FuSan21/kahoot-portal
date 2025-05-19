import type { Metadata } from "next";
import { AnswerMosaic } from "@/components/answer-mosaic";
import { Logo } from "@/components/logo";
import { safeNext } from "@/lib/supabase/proxy";
import { GoogleButton } from "./google-button";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const failed = params.error === "auth";

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between gap-12 px-6 pt-8 pb-10 sm:px-12 lg:px-16 lg:py-12">
        <Logo />
        <div className="max-w-xl">
          <p className="t-eyebrow mb-5">Live quiz games</p>
          <h1 className="t-hero">Run a quiz night from one screen.</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Players join from their phones with a six-digit code. Faster correct answers score up to 1,000 points.
          </p>
        </div>
        <div className="w-full max-w-md">
          <GoogleButton next={next} />
          {failed && (
            <p role="alert" className="mt-4 text-sm text-ember">
              Sign-in did not finish. Try again.
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">You need a Google account to host or play.</p>
        </div>
      </section>
      <section className="relative hidden items-center overflow-hidden border-l border-line bg-surface/40 px-12 lg:flex">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-ember/20 blur-[120px]" />
        <AnswerMosaic className="relative mx-auto max-w-lg" />
      </section>
    </main>
  );
}
