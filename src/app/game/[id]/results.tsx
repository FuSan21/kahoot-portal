import React, { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";
import { toast } from "sonner";

interface ResultsProps {
  participant: Participant;
  gameId: string;
}

interface DetailedGameResult {
  participant_id: string;
  nickname: string;
  total_score: number;
  scores: number[];
  profiles: {
    profiles: {
      avatar_url: string | null;
    } | null;
  } | null;
}

export default function Results({ participant, gameId }: ResultsProps) {
  const [personalResult, setPersonalResult] =
    useState<DetailedGameResult | null>(null);
  const [allResults, setAllResults] = useState<DetailedGameResult[]>([]);

  useEffect(() => {
    const getResults = async () => {
      // Fetch all results
      const { data: allData, error: allError } = await supabase
        .from("game_results")
        .select(
          `
          *,
          participants(user_id),
          profiles:participants(user:profiles(avatar_url))
        `
        )
        .eq("game_id", gameId)
        .order("total_score", { ascending: false });

      if (allError) {
        return toast.error(allError.message);
      }

      if (allData) {
        const formattedResults = allData.map((result) => ({
          participant_id: result.participant_id!,
          nickname: result.nickname!,
          total_score: result.total_score || 0,
          scores: result.scores || [],
          profiles: {
            profiles: {
              avatar_url: result.profiles?.[0]?.user?.avatar_url || null,
            },
          },
        }));
        setAllResults(formattedResults);

        // Find personal result
        const personal = formattedResults.find(
          (r) => r.participant_id === participant.id
        );
        if (personal) {
          setPersonalResult(personal);
        }
      }
    };
    getResults();
  }, [gameId, participant.id]);

  return (
    <div className="flex flex-col flex-grow  w-full items-center bg-green-500 p-4">
      {/* Personal Score Card */}
      <div className="p-8 bg-black text-white rounded-lg mb-8 w-full max-w-2xl text-center">
        <h2 className="text-2xl pb-4">Hey {participant.nickname}！</h2>
        {personalResult ? (
          <>
            <p className="text-xl font-bold mb-2">
              Your final score: {personalResult.total_score} points
            </p>
            <p className="text-sm">({personalResult.scores.join("+")})</p>
          </>
        ) : (
          <p>Loading your score...</p>
        )}
        <p className="mt-4">Thanks for playing 🎉</p>
      </div>

      {/* All Results */}
      <div className="w-full max-w-2xl bg-black p-4 rounded-lg">
        <h3 className="text-xl text-white mb-4 text-center">Leaderboard</h3>
        {allResults.map((result, index) => (
          <div
            key={result.participant_id}
            className={`flex justify-between items-center bg-white py-2 px-4 rounded my-2 w-full ${
              result.participant_id === participant.id
                ? "border-4 border-yellow-400"
                : ""
            } ${index < 3 ? "shadow-xl font-bold" : ""}`}
          >
            <div className={`pr-4 ${index < 3 ? "text-3xl" : "text-l"}`}>
              {index + 1}
            </div>
            <div className="flex items-center flex-grow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  result.profiles?.profiles?.avatar_url || "/default-avatar.png"
                }
                alt={`${result.nickname}'s avatar`}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div
                className={`font-bold ${
                  index < 3 ? "text-xl sm:text-2xl" : "text-lg"
                }`}
              >
                {result.nickname}
                {result.participant_id === participant.id && " (You)"}
              </div>
            </div>
            <div className="pl-2 text-right">
              <div className="text-xl font-bold">{result.total_score}</div>
              <div className="text-sm">({result.scores.join("+")})</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
