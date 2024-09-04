"use client";

import { QuizSet, supabase } from "@/types/types";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([]);

  useEffect(() => {
    const getQuizSets = async () => {
      const { data, error } = await supabase
        .from("quiz_sets")
        .select(`*, questions(*, choices(*))`)
        .order("created_at", { ascending: false });
      if (error) {
        alert("Failed to fetch quiz sets");
        return;
      }
      setQuizSet(data);
    };
    getQuizSets();
  }, []);

  const startGame = async (quizSetId: string) => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (!sessionData.session) {
      await supabase.auth.signInAnonymously();
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        quiz_set_id: quizSetId,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      alert("Failed to start game");
      return;
    }

    const gameId = data.id;
    window.open(`/host/game/${gameId}`, "_self", "noopener,noreferrer");
  };

  return (
    <>
      {quizSet.map((quizSet) => (
        <div
          key={quizSet.id}
          className="flex justify-start shadow my-4 mx-2 rounded w-full p-2"
        >
          <Image
            className="h-28"
            src={"/quiz-image/" + quizSet.id + "/" + quizSet.image}
            alt={quizSet.name}
            width={100}
            height={100}
          />
          <div className="p-2 flex flex-col justify-between items-stretch flex-grow">
            <h2 className="font-bold">{quizSet.name}</h2>
            <div className="flex justify-between items-end">
              <div>{quizSet.questions.length} questions</div>
              <div>
                <button
                  className="bg-green-500 text-white py-1 px-4 rounded"
                  onClick={() => startGame(quizSet.id)}
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
