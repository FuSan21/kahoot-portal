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
import GameLeaderboard from "@/components/GameLeaderboard";
import { UserScore } from "@/types/quiz";
import SocialBonusReview from "@/app/components/SocialBonusReview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailedGameResult extends GameResult {
  scores: number[];
  profiles: {
    profiles: {
      avatar_url: string | null;
    } | null;
  } | null;
}

interface QuizSetWithSocial extends QuizSet {
  social_share_link: string | null;
  social_bonus_points: number | null;
}

export default function Results({
  quizSet,
  gameId,
  isAuthorized,
}: {
  participants: Participant[];
  quizSet: QuizSetWithSocial;
  gameId: string;
  isAuthorized: boolean;
}) {
  const [gameResults, setGameResults] = useState<DetailedGameResult[]>([]);
  const { width, height } = useWindowSize();
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<UserScore[]>([]);
  const [currentDate] = useState(new Date());

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

        // Get all quiz history for the month
        const { data: historyData, error: historyError } = await supabase.rpc(
          "get_monthly_leaderboard",
          {
            start_date: startOfMonth.toISOString(),
            end_date: endOfMonth.toISOString(),
          }
        );

        if (historyError) throw historyError;

        // Format the data into UserScore objects
        const leaderboard = (historyData || []).map(
          (item: any, index: number) => ({
            user_id: item.user_id,
            user_email: item.email || "Unknown User",
            full_name: item.full_name || "Anonymous",
            avatar_url: item.avatar_url || "/default-avatar.png",
            total_score: item.total_score || 0,
            rank: index + 1,
          })
        );

        // Show top 10 for host view
        setMonthlyLeaderboard(leaderboard.slice(0, 10));
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
    <div className="relative min-h-screen bg-background">
      <Confetti
        width={width}
        height={height}
        recycle={true}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 0 }}
      />
      <div className="flex flex-col items-center p-4 relative z-10 max-w-7xl mx-auto">
        {/* Quiz Name Card */}
        <Card className="w-full max-w-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              {quizSet.name}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Game Results */}
        <GameLeaderboard results={gameResults} />

        {/* Social Bonus Review */}
        {(quizSet?.social_bonus_points ?? 0) > 0 && (
          <div className="w-full max-w-2xl mb-8">
            <SocialBonusReview
              gameId={gameId}
              bonusPoints={quizSet.social_bonus_points!}
            />
          </div>
        )}

        {/* Monthly Leaderboard */}
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
  );
}
