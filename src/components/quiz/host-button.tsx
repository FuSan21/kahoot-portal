"use client";

import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function HostButton({ quizSetId, className, size = "sm" }: { quizSetId: string; className?: string; size?: "sm" | "default" | "lg" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const { data, error } = await createClient()
        .from("games")
        .insert({ quiz_set_id: quizSetId })
        .select("id")
        .single();
      if (error || !data) {
        toast.error("Could not open a lobby", { description: error?.message });
        return;
      }
      router.push(`/host/${data.id}`);
    });
  }

  return (
    <Button size={size} onClick={start} disabled={pending} className={cn("relative z-10", className)}>
      {pending ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
      Host game
    </Button>
  );
}
