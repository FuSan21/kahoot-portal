import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./supabase";

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function supabaseAdminClient() {
  if (typeof window === "undefined") {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  throw new Error("Admin client should only be created on the server");
}

export type Participant = Database["public"]["Tables"]["participants"]["Row"];

export type Choice = Database["public"]["Tables"]["choices"]["Row"];

export type Question = Database["public"]["Tables"]["questions"]["Row"] & {
  choices: Choice[];
};

export type QuizSet = Database["public"]["Tables"]["quiz_sets"]["Row"] & {
  questions: Question[];
};

export type Answer = Database["public"]["Tables"]["answers"]["Row"];

export type Game = Database["public"]["Tables"]["games"]["Row"];

export type GameResult = Database["public"]["Views"]["game_results"]["Row"];
