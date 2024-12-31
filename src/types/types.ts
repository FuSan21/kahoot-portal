import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { Database as DatabaseGenerated } from "./supabase";

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

export interface Participant {
  id: string;
  game_id: string;
  user_id: string;
  nickname: string;
  created_at: string;
  profile?: {
    avatar_url: string | null;
  } | null;
}

export type Choice = Database["public"]["Tables"]["choices"]["Row"];

export type Question = Database["public"]["Tables"]["questions"]["Row"] & {
  choices: Choice[];
};

export type QuizSet = Database["public"]["Tables"]["quiz_sets"]["Row"] & {
  questions: Question[];
  social_share_link?: string | null;
  social_bonus_points?: number | null;
};

export type Answer = Database["public"]["Tables"]["answers"]["Row"];

export type Game = Database["public"]["Tables"]["games"]["Row"];

export type GameResult = Database["public"]["Views"]["game_results"]["Row"] & {
  scores: number[];
};

export interface Database extends Omit<DatabaseGenerated, "public"> {
  public: {
    Tables: DatabaseGenerated["public"]["Tables"];
    Views: DatabaseGenerated["public"]["Views"];
    Functions: DatabaseGenerated["public"]["Functions"] & {
      get_monthly_leaderboard: {
        Args: {
          start_date: string;
          end_date: string;
        };
        Returns: {
          user_id: string;
          email: string;
          full_name: string;
          avatar_url: string;
          total_score: number;
        }[];
      };
    };
    Enums: DatabaseGenerated["public"]["Enums"];
    CompositeTypes: DatabaseGenerated["public"]["CompositeTypes"];
  };
}
