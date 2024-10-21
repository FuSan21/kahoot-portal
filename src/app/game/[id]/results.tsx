import React, { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";
import { toast } from "sonner";

interface ResultsProps {
  participant: Participant;
  gameId: string;
}

export default function Results({ participant, gameId }: ResultsProps) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const getScore = async () => {
      const { data, error } = await supabase
        .from("game_results")
        .select()
        .eq("game_id", gameId)
        .eq("participant_id", participant.id)
        .order("total_score");
      if (error) {
        return toast.error(error.message);
      }
      setScore(data[0].total_score);
    };
    getScore();
  }, [gameId, participant.id]);

  return (
    <div className="flex flex-col flex-grow justify-center items-center text-center">
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
