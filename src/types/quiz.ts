export interface QuizResult {
  game_id: string;
  quiz_name: string;
  total_score: number;
  played_at: string;
  participant_id?: string;
}

export interface UserScore {
  user_id: string;
  user_email: string;
  full_name: string;
  avatar_url: string;
  total_score: number;
  rank: number;
}

export interface QuizFormData {
  name: string;
  description: string;
  coverImage: File | null;
  questions: QuizQuestion[];
  is_public: boolean;
}

export interface QuizQuestion {
  body: string;
  image?: File | null;
  choices: QuizChoice[];
}

export interface QuizChoice {
  body: string;
  is_correct: boolean;
}
