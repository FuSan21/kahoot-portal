"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <h1 className="t-title">Something went wrong.</h1>
        <p className="text-lg text-muted-foreground">Try again. If it keeps happening, reload the page.</p>
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
