export interface QuizFormData {
  name: string;
  description: string;
  coverImage: File | null;
  questions: QuizQuestion[];
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
