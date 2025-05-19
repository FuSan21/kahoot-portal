import type { QuizCardData } from "@/components/quiz/quiz-card";
import { createClient } from "@/lib/supabase/server";

export async function listQuizzes({ limit, viewerId }: { limit?: number; viewerId: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("quiz_sets")
    .select("id, name, description, image, is_public, created_by, created_at, questions(count), owner:profiles(full_name)")
    .or(`is_public.eq.true,created_by.eq.${viewerId}`)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;

  return (data ?? []).map(
    (q): QuizCardData => ({
      id: q.id,
      name: q.name,
      description: q.description,
      image: q.image,
      is_public: q.is_public,
      questionCount: q.questions[0]?.count ?? 0,
      ownerName: q.owner?.full_name,
      mine: q.created_by === viewerId,
    }),
  );
}
