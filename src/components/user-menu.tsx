"use client";

import { LogOut, History } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/game";
import type { Viewer } from "@/lib/supabase/server";

export function UserMenu({ viewer }: { viewer: Viewer }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full" aria-label="Account menu">
        <PlayerAvatar name={viewer.name} src={viewer.avatarUrl} className="size-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{viewer.name}</p>
          {viewer.email && <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/history">
            <History /> Game history
          </Link>
        </DropdownMenuItem>
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PlayerAvatar({ name, src, className }: { name: string | null; src: string | null | undefined; className?: string }) {
  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-surface-2 text-xs font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
