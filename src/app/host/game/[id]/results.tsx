import React, { useEffect, useState } from "react";
import {
  Answer,
  GameResult,
  Participant,
  Question,
  QuizSet,
  supabase,
} from "@/types/types";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import { toast } from "sonner";

interface DetailedGameResult extends GameResult {
  scores: number[];
  profiles: {
    profiles: {
      avatar_url: string | null;
    } | null;
  } | null;
}

export default function Results({
  quizSet,
  gameId,
  isAuthorized,
}: {
  participants: Participant[];
  quizSet: QuizSet;
  gameId: string;
  isAuthorized: boolean;
}) {
  const [gameResults, setGameResults] = useState<DetailedGameResult[]>([]);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const getResults = async () => {
      const { data, error } = await supabase
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

      if (error) {
        return toast.error(error.message);
      }

      const formattedResults = data?.map((result) => ({
        ...result,
        profiles: {
          profiles: {
            avatar_url: result.profiles?.[0]?.user?.avatar_url || null,
          },
        },
      }));

      setGameResults(formattedResults as DetailedGameResult[]);
    };
    getResults();
  }, [gameId]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col flex-grow w-full items-center bg-green-500 p-4">
      <div className="p-8 bg-black text-white rounded-lg mb-8 w-full max-w-2xl text-center">
        <p className="text-xl font-bold mb-2">{quizSet.name}</p>
      </div>

      <div className="w-full max-w-2xl bg-black p-4 rounded-lg">
        <h3 className="text-xl text-white mb-4 text-center">Leaderboard</h3>
        {gameResults.map((gameResult, index) => (
          <div
            key={gameResult.participant_id}
            className={`flex justify-between items-center bg-white py-2 px-4 rounded my-2 w-full ${
              index < 3 ? "shadow-xl font-bold" : ""
            }`}
          >
            <div className={`pr-4 ${index < 3 ? "text-3xl" : "text-l"}`}>
              {index + 1}
            </div>
            <div className="flex items-center flex-grow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  gameResult.profiles?.profiles?.avatar_url ||
                  "/default-avatar.png"
                }
                alt={`${gameResult.nickname}'s avatar`}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div
                className={`font-bold ${
                  index < 3 ? "text-xl sm:text-2xl" : "text-lg"
                }`}
              >
                {gameResult.nickname}
              </div>
            </div>
            <div className="pl-2 text-right">
              <div className="text-xl font-bold">{gameResult.total_score}</div>
              <div className="text-sm">({gameResult.scores.join("+")})</div>
            </div>
          </div>
        ))}
      </div>
      <Confetti width={width} height={height} recycle={true} />
    </div>
  );
}
