"use client";

import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { formatCode, quizImageUrl, type Question } from "@/lib/game";
import { cn } from "@/lib/utils";

/** Full-screen frame for the host stage and the player's phone. */
export function GameShell({
  children,
  code,
  title,
  right,
  className,
}: {
  children: React.ReactNode;
  code?: string;
  title?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ground-grid flex min-h-dvh flex-col", className)}>
      <header className="flex h-16 shrink-0 items-center gap-4 px-4 sm:px-8">
        <Link href="/" aria-label="Leave to home" className="rounded-lg">
          <LogoMark />
        </Link>
        {title && <span className="hidden truncate text-[15px] text-muted-foreground sm:block">{title}</span>}
        <div className="ml-auto flex items-center gap-3">
          {code && (
            <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-sm tabular">
              PIN {formatCode(code)}
            </span>
          )}
          {right}
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}

export function GameLoading({ label = "Loading game" }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function GameMessage({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <GameShell>
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="t-title">{title}</h1>
        <p className="text-lg text-muted-foreground">{body}</p>
        {action ?? (
          <Button asChild size="lg" className="mt-4">
            <Link href="/">Back to home</Link>
          </Button>
        )}
      </div>
    </GameShell>
  );
}

export function QuestionImage({ quizId, question, className }: { quizId: string; question: Question; className?: string }) {
  const src = quizImageUrl(quizId, question.image);
  if (!src) return null;
  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] border border-line bg-surface", className)}>
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
    </div>
  );
}

export function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#ff4a1f", "#2fa8ff", "#ffc933", "#34d399", "#eff0f1"];
  const end = Date.now() + 1600;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
