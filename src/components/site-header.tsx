"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import type { Viewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Join" },
  { href: "/library", label: "Library" },
  { href: "/create", label: "Create" },
  { href: "/history", label: "History" },
  { href: "/how-to", label: "How it works" },
];

export function SiteHeader({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5 sm:h-[72px] sm:px-8">
        <a href="#main" className="absolute size-px overflow-hidden [clip-path:inset(50%)] focus:size-auto focus:[clip-path:none]">
          Skip to content
        </a>
        <Logo />
        <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground",
                  "after:absolute after:inset-x-0 after:-bottom-[23px] after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
                  "hover:after:scale-x-100",
                  active && "text-foreground after:scale-x-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/library">Host a game</Link>
          </Button>
          <UserMenu viewer={viewer} />
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 bg-background px-5 pt-6 md:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 text-3xl font-medium tracking-tight"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
