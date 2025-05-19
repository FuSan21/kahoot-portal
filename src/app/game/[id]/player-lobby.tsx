"use client";

import { motion } from "motion/react";
import { PlayerAvatar } from "@/components/user-menu";
import type { Participant, ParticipantWithProfile } from "@/lib/game";
import type { Viewer } from "@/lib/supabase/server";

const TONES = ["bg-ember", "bg-sky", "bg-sun", "bg-mint"];

export function PlayerLobby({
  participant,
  participants,
  viewer,
}: {
  participant: Participant;
  participants: ParticipantWithProfile[];
  viewer: Viewer;
}) {
  const others = participants.filter((p) => p.id !== participant.id);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-10 px-6 pb-16 text-center">
      <div className="grid grid-cols-2 gap-2.5" aria-hidden>
        {TONES.map((tone, i) => (
          <motion.span
            key={tone}
            className={`size-14 rounded-2xl sm:size-16 ${tone}`}
            animate={{ scale: [1, 0.86, 1], rotate: [0, i % 2 ? 6 : -6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div>
        <p className="t-eyebrow mb-4">You are in</p>
        <div className="mb-4 flex items-center justify-center gap-3">
          <PlayerAvatar name={participant.nickname} src={viewer.avatarUrl} className="size-12" />
          <h1 className="t-title truncate">{participant.nickname}</h1>
        </div>
        <p className="text-lg text-muted-foreground">Watch the host&rsquo;s screen. The first question starts when they press start.</p>
      </div>
      <div className="flex items-center gap-3 rounded-full border border-line bg-surface py-2 pr-4 pl-2">
        <div className="flex -space-x-2">
          {others.slice(0, 5).map((p) => (
            <PlayerAvatar key={p.id} name={p.nickname} src={p.profile?.avatar_url} className="size-8 ring-2 ring-surface" />
          ))}
        </div>
        <span className="text-[15px] text-muted-foreground">
          {others.length === 0 ? "You are the first one here" : `${others.length} other ${others.length === 1 ? "player" : "players"} waiting`}
        </span>
      </div>
    </div>
  );
}
