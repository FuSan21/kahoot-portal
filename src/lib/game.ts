import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
export type Game = Tables["games"]["Row"];
export type QuizSet = Tables["quiz_sets"]["Row"];
export type Participant = Tables["participants"]["Row"];
export type Answer = Tables["answers"]["Row"];
export type Choice = Omit<Tables["choices"]["Row"], "is_correct">;
export type Question = Tables["questions"]["Row"] & { choices: Choice[] };
export type QuizWithQuestions = QuizSet & { questions: Question[] };
export type GameResult = Database["public"]["Functions"]["get_game_results"]["Returns"][number];
export type LeaderboardRow = Database["public"]["Functions"]["get_monthly_leaderboard"]["Returns"][number];
export type HistoryRow = Database["public"]["Functions"]["get_my_history"]["Returns"][number];
export type ParticipantWithProfile = Participant & { profile: { avatar_url: string | null } | null };

/** Choices stay hidden for this long after a question opens (mirrors private.score_answer). */
export const CHOICE_REVEAL_DELAY_MS = 2000;

/** Columns safe to select from choices (is_correct is not granted to clients). */
export const CHOICE_COLUMNS = "id, created_at, question_id, body, position";
export const QUIZ_WITH_QUESTIONS = `*, questions(*, choices(${CHOICE_COLUMNS}))`;

export const ANSWER_TONES = ["ember", "sky", "sun", "mint"] as const;
export type AnswerTone = (typeof ANSWER_TONES)[number];
export const ANSWER_LETTERS = ["A", "B", "C", "D"] as const;

export function sortQuiz<T extends QuizWithQuestions>(quiz: T): T {
  return {
    ...quiz,
    questions: [...quiz.questions]
      .sort((a, b) => a.order - b.order)
      .map((q) => ({ ...q, choices: [...q.choices].sort((a, b) => a.position - b.position) })),
  };
}

export function quizImageUrl(quizId: string, image: string | null | undefined) {
  if (!image) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quiz_images/${quizId}/${image}`;
}

export function siteUrl(path = "") {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function formatCode(code: string) {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** Milliseconds left to answer, given the question's start time and limit. */
export function remainingMs(startTime: string | null, limitSeconds: number, now = Date.now()) {
  if (!startTime) return limitSeconds * 1000;
  const opensAt = new Date(startTime).getTime() + CHOICE_REVEAL_DELAY_MS;
  return Math.max(0, Math.min(limitSeconds * 1000, opensAt + limitSeconds * 1000 - now));
}

export function initials(name: string | null | undefined) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
