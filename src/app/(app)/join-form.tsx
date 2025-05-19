"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CodeInput } from "@/components/code-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Game codes have six digits.");
      return;
    }
    startTransition(async () => {
      const { data } = await createClient()
        .from("games")
        .select("id, phase")
        .eq("code", code)
        .neq("phase", "result")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) {
        setError("No live game uses that code. Check the host's screen.");
        return;
      }
      router.push(`/game/${data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl" noValidate>
      <label htmlFor="game-code" className="t-eyebrow mb-3 block">
        Game code
      </label>
      <CodeInput
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(null);
        }}
        invalid={Boolean(error)}
        autoFocus
      />
      <div className="mt-3 h-6 text-sm text-ember" role="alert">
        {error}
      </div>
      <Button type="submit" size="xl" className="mt-2 w-full sm:w-auto" disabled={pending || code.length !== 6}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Join game
        {!pending && <ArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" />}
      </Button>
    </form>
  );
}
