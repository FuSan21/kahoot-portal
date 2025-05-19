import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-7 grid-cols-2 gap-[3px]", className)}>
      <span className="rounded-[4px] bg-ember" />
      <span className="rounded-[4px] bg-sky" />
      <span className="rounded-[4px] bg-sun" />
      <span className="rounded-[4px] bg-mint" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 text-[17px] font-medium tracking-tight", className)}>
      <LogoMark />
      <span>
        Kahoot <span className="text-muted-foreground">Portal</span>
      </span>
    </Link>
  );
}
