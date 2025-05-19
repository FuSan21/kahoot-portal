import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient, getViewer } from "@/lib/supabase/server";
import { PlayerGame } from "./player-game";

export const metadata: Metadata = { title: "Play" };

export default async function GamePage({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/game/${id}`);

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("host_user_id").eq("id", id).maybeSingle();
  if (!game) notFound();
  if (game.host_user_id === viewer.id) redirect(`/host/${id}`);

  return <PlayerGame gameId={id} viewer={viewer} />;
}
