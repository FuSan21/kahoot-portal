import React, { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";
import { toast } from "sonner";

interface ResultsProps {
  participant: Participant;
  gameId: string;
}

interface DetailedGameResult {
  total_score: number;
  scores: number[];
}

export default function Results({ participant, gameId }: ResultsProps) {
  const [result, setResult] = useState<DetailedGameResult | null>(null);

  useEffect(() => {
    const getResult = async () => {
      const { data, error } = await supabase
        .from("game_results")
        .select()
        .eq("game_id", gameId)
        .eq("participant_id", participant.id)
        .single();

      if (error) {
        return toast.error(error.message);
      }

      if (data) {
        const detailedResult: DetailedGameResult = {
          total_score: data.total_score || 0,
          scores: data.scores || [],
        };
        setResult(detailedResult);
      }
    };
    getResult();
  }, [gameId, participant.id]);

  return (
    <div className="flex flex-col flex-grow justify-center items-center text-center">
      <div className="p-8 bg-black text-white rounded-lg">
        <h2 className="text-2xl pb-4">Hey {participant.nickname}！</h2>
        {result ? (
          <>
            <p className="text-xl font-bold mb-2">
              Your final score: {result.total_score} points
            </p>
            <p className="text-sm">({result.scores.join("+")})</p>
          </>
        ) : (
          <p>Loading your score...</p>
        )}
        <p className="mt-4">Thanks for playing 🎉</p>
      </div>
    </div>
  );
}
