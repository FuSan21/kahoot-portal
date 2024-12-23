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
import MonthlyLeaderboard from "@/app/components/MonthlyLeaderboard";
import GameLeaderboard from "@/app/components/GameLeaderboard";
import { UserScore } from "@/types/quiz";

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
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<UserScore[]>([]);
  const [currentDate] = useState(new Date()); // We only show current month in results

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

  useEffect(() => {
    const fetchMonthlyLeaderboard = async () => {
      try {
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const { data, error } = await supabase
          .from("quiz_history")
          .select(
            `
            user_id,
            users:user_id (
              email,
              full_name,
              avatar_url
            ),
            total_score
          `
          )
          .gte("played_at", startOfMonth.toISOString())
          .lte("played_at", endOfMonth.toISOString());

        if (error) throw error;

        // Calculate total score per user
        const userScores: { [key: string]: UserScore } = {};
        data.forEach((item: any) => {
          if (!userScores[item.user_id]) {
            userScores[item.user_id] = {
              user_id: item.user_id,
              user_email: item.users?.email || "Unknown User",
              full_name: item.users?.full_name || "Unknown User",
              avatar_url: item.users?.avatar_url || "/default-avatar.png",
              total_score: 0,
              rank: 1,
            };
          }
          userScores[item.user_id].total_score += item.total_score || 0;
        });

        // Convert to array, sort by score, and add ranks
        const sortedLeaderboard = Object.values(userScores)
          .sort((a, b) => b.total_score - a.total_score)
          .map((score, index) => ({
            ...score,
            rank: index + 1,
          }));

        // Show top 10 for host view
        setMonthlyLeaderboard(sortedLeaderboard.slice(0, 10));
      } catch (error) {
        console.error("Error fetching monthly leaderboard:", error);
      }
    };

    fetchMonthlyLeaderboard();
  }, [currentDate]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="relative">
      <Confetti
        width={width}
        height={height}
        recycle={true}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 0 }}
      />
      <div className="flex flex-col flex-grow w-full items-center bg-green-500 p-4 relative z-10">
        {/* Quiz Name Card */}
        <div className="bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 rounded-2xl shadow-xl overflow-hidden mb-8 w-full max-w-2xl">
          <div className="backdrop-blur-sm bg-white/10 p-8 text-center">
            <p className="text-xl font-bold mb-2 text-white">{quizSet.name}</p>
          </div>
        </div>

        {/* Game Results */}
        <GameLeaderboard results={gameResults} />

        {/* Monthly Leaderboard */}
        <div className="w-full max-w-2xl">
          <MonthlyLeaderboard
            monthlyLeaderboard={monthlyLeaderboard}
            currentUserScore={null}
            currentUserId=""
            allowMonthNavigation={false}
            currentDate={currentDate}
            onPreviousMonth={() => {}}
            onNextMonth={() => {}}
            onCurrentMonth={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
