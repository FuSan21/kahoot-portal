import React, { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";

interface ResultsProps {
  participant: Participant;
  gameId: string;
}

export default function Results({ participant, gameId }: ResultsProps) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("score")
        .eq("id", participant.id)
        .single();

      if (error) {
        console.error("Error fetching score:", error);
      } else {
        setScore(data.score);
      }
    };

    fetchScore();
  }, [participant.id]);

  return (
    <div className="flex justify-center items-center min-h-screen text-center">
      <div className="p-8 bg-black text-white rounded-lg">
        <h2 className="text-2xl pb-4">Hey {participant.nickname}！</h2>
        {score !== null ? (
          <p>Your final score: {score} points</p>
        ) : (
          <p>Loading your score...</p>
        )}
        <p className="mt-4">Thanks for playing 🎉</p>
      </div>
    </div>
  );
}
