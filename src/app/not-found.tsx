import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="ground-grid grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <LogoMark className="size-12" />
        <h1 className="t-title">That page is not here.</h1>
        <p className="text-lg text-muted-foreground">The game may have ended or the link is wrong.</p>
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
