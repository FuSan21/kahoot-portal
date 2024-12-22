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
    <div className="flex flex-col flex-grow bg-black">
      <div className="text-center">
        <h1 className="text-3xl my-4 py-4 px-12 bg-white inline-block rounded font-bold">
          {quizSet.name}
        </h1>
      </div>
      <div className="flex justify-center items-stretch">
        <div className="w-full max-w-2xl">
          {gameResults.map((gameResult, index) => (
            <div
              key={gameResult.participant_id}
              className={`flex justify-between items-center bg-white py-2 px-4 rounded my-4 w-full ${
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
                    index < 3 ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl"
                  }`}
                >
                  {gameResult.nickname}
                </div>
              </div>
              <div className="pl-2 text-right">
                <div className="text-xl font-bold">
                  {gameResult.total_score}
                </div>
                <div className="text-sm">({gameResult.scores.join("+")})</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Confetti width={width} height={height} recycle={true} />
    </div>
  );
}
