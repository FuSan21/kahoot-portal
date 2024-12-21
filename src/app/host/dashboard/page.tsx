"use client";

import { QuizSet, supabase } from "@/types/types";
import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([]);

  useEffect(() => {
    const getQuizSets = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        toast.error("Failed to fetch user");
        return;
      }

      const { data, error } = await supabase
        .from("quiz_sets")
        .select(`*, questions(*, choices(*))`)
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to fetch quiz sets");
        return;
      }
      setQuizSet(data);
    };
    getQuizSets();
  }, []);

  const startGame = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from("games")
      .insert({
        quiz_set_id: quizSetId,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      toast.error("Failed to start game");
      return;
    }

    const gameId = data.id;
    window.open(`/host/game/${gameId}`, "_self", "noopener,noreferrer");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {quizSet.map((quizSet) => (
        <div
          key={quizSet.id}
          className="flex flex-col bg-white shadow rounded overflow-hidden"
        >
          <div className="p-4 flex items-start">
            <Image
              className="h-20 w-20 object-cover rounded flex-shrink-0"
              src={
                quizSet.image
                  ? `/api/getImage?path=${quizSet.id}/${quizSet.image}`
                  : "/default.png"
              }
              alt={quizSet.name}
              width={80}
              height={80}
            />
            <div className="ml-4 flex-grow min-w-0">
              <h2 className="font-bold text-lg break-words">{quizSet.name}</h2>
              <div className="text-sm text-gray-600 mt-1">
                {quizSet.questions.length} questions
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 mt-auto">
            <button
              className="bg-green-500 text-white py-2 px-4 rounded w-full hover:bg-green-600 transition-colors"
              onClick={() => startGame(quizSet.id)}
            >
              Start Game
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
