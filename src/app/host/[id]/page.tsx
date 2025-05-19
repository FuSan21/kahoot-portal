import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient, getViewer } from "@/lib/supabase/server";
import { HostGame } from "./host-game";

export const metadata: Metadata = { title: "Host" };

export default async function HostPage({ params }: PageProps<"/host/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/host/${id}`);

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("host_user_id").eq("id", id).maybeSingle();
  if (!game) notFound();
  if (game.host_user_id !== viewer.id) redirect(`/game/${id}`);

  return <HostGame gameId={id} />;
}
