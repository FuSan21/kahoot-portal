import React, { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";
import { toast } from "sonner";
import MonthlyLeaderboard from "@/app/components/MonthlyLeaderboard";
import GameLeaderboard from "@/app/components/GameLeaderboard";
import { UserScore } from "@/types/quiz";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

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
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<UserScore[]>([]);
  const [currentUserScore, setCurrentUserScore] = useState<UserScore | null>(
    null
  );
  const [currentDate] = useState(new Date()); // We only show current month in results
  const { width, height } = useWindowSize();

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

        // Find current user's score
        const currentUserScore =
          sortedLeaderboard.find(
            (score) => score.user_id === participant.user_id
          ) || null;

        if (currentUserScore) {
          setCurrentUserScore(currentUserScore);

          // Get top 9 users (leaving space for current user if needed)
          const top = sortedLeaderboard.slice(0, 9);

          // If current user is in top 9, show top 10
          if (currentUserScore.rank <= 9) {
            setMonthlyLeaderboard(sortedLeaderboard.slice(0, 10));
          } else {
            // If current user exists but not in top 9, show top 9 + current user
            setMonthlyLeaderboard(top);
          }
        } else {
          // If current user has no score, just show top 10
          setMonthlyLeaderboard(sortedLeaderboard.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching monthly leaderboard:", error);
      }
    };

    if (participant.user_id) {
      fetchMonthlyLeaderboard();
    }
  }, [participant.user_id, currentDate]);

  return (
    <div className="relative">
      <Confetti
        width={width}
        height={height}
        recycle={true}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 0 }}
      />
      <div className="flex flex-col flex-grow w-full items-center bg-green-500 p-4 relative z-10">
        {/* Personal Score Card */}
        <div className="bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 rounded-2xl shadow-xl overflow-hidden mb-8 w-full max-w-2xl">
          <div className="backdrop-blur-sm bg-white/10 p-8 text-center">
            <h2 className="text-2xl pb-4 text-white">
              Hey {participant.nickname}！
            </h2>
            {personalResult ? (
              <>
                <p className="text-xl font-bold mb-2 text-white">
                  Your final score: {personalResult.total_score} points
                </p>
                <p className="text-sm text-white/80">
                  ({personalResult.scores.join("+")})
                </p>
              </>
            ) : (
              <p className="text-white">Loading your score...</p>
            )}
            <p className="mt-4 text-white">Thanks for playing 🎉</p>
          </div>
        </div>

        {/* Game Results */}
        <GameLeaderboard
          results={allResults}
          currentParticipantId={participant.id}
        />

        {/* Monthly Leaderboard */}
        {participant.user_id && (
          <div className="w-full max-w-2xl">
            <MonthlyLeaderboard
              monthlyLeaderboard={monthlyLeaderboard}
              currentUserScore={currentUserScore}
              currentUserId={participant.user_id}
              allowMonthNavigation={false}
              currentDate={currentDate}
              onPreviousMonth={() => {}}
              onNextMonth={() => {}}
              onCurrentMonth={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
