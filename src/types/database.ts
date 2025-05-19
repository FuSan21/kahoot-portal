export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          choice_id: string
          created_at: string
          game_id: string
          id: string
          is_correct: boolean
          participant_id: string
          question_id: string
          response_ms: number
          score: number
        }
        Insert: {
          choice_id: string
          created_at?: string
          game_id: string
          id?: string
          is_correct?: boolean
          participant_id: string
          question_id: string
          response_ms?: number
          score?: number
        }
        Update: {
          choice_id?: string
          created_at?: string
          game_id?: string
          id?: string
          is_correct?: boolean
          participant_id?: string
          question_id?: string
          response_ms?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      choices: {
        Row: {
          body: string
          created_at: string
          id: string
          is_correct: boolean
          position: number
          question_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_correct?: boolean
          position?: number
          question_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          code: string
          created_at: string
          current_question_sequence: number
          current_question_start_time: string | null
          host_user_id: string
          id: string
          is_answer_revealed: boolean
          phase: string
          quiz_set_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          current_question_sequence?: number
          current_question_start_time?: string | null
          host_user_id?: string
          id?: string
          is_answer_revealed?: boolean
          phase?: string
          quiz_set_id: string
        }
        Update: {
          code?: string
          created_at?: string
          current_question_sequence?: number
          current_question_start_time?: string | null
          host_user_id?: string
          id?: string
          is_answer_revealed?: boolean
          phase?: string
          quiz_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          game_id: string
          id: string
          nickname: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          nickname: string
          user_id?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          nickname?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          body: string
          created_at: string
          id: string
          image: string | null
          order: number
          quiz_set_id: string
          time_limit: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image?: string | null
          order: number
          quiz_set_id: string
          time_limit?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image?: string | null
          order?: number
          quiz_set_id?: string
          time_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sets: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image: string | null
          is_public: boolean
          name: string
          social_bonus_points: number
          social_share_link: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image?: string | null
          is_public?: boolean
          name: string
          social_bonus_points?: number
          social_share_link?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image?: string | null
          is_public?: boolean
          name?: string
          social_bonus_points?: number
          social_share_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_bonus_submissions: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          screenshot_paths: string[]
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          screenshot_paths?: string[]
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          screenshot_paths?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_bonus_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_quiz: { Args: { payload: Json }; Returns: string }
      generate_game_code: { Args: never; Returns: string }
      get_correct_choice: {
        Args: { _game_id: string; _question_id: string }
        Returns: string
      }
      get_game_results: {
        Args: { _game_id: string }
        Returns: {
          answer_score: number
          avatar_url: string
          bonus_score: number
          correct_count: number
          nickname: string
          participant_id: string
          rank: number
          total_score: number
          user_id: string
        }[]
      }
      get_monthly_leaderboard: {
        Args: { _end: string; _start: string }
        Returns: {
          avatar_url: string
          full_name: string
          games_played: number
          rank: number
          total_score: number
          user_id: string
        }[]
      }
      get_my_history: {
        Args: never
        Returns: {
          game_id: string
          my_rank: number
          my_score: number
          phase: string
          played_at: string
          player_count: number
          quiz_image: string
          quiz_name: string
          quiz_set_id: string
          role: string
        }[]
      }
      get_question_stats: {
        Args: { _game_id: string; _question_id: string }
        Returns: {
          answer_count: number
          choice_id: string
        }[]
      }
      ping: { Args: never; Returns: string }
      server_now: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
