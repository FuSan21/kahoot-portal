"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { QuizResult, UserScore } from "@/types/quiz";

export default function HistoryPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<UserScore[]>([]);
  const [currentUserScore, setCurrentUserScore] = useState<UserScore | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await Promise.all([
          fetchQuizHistory(user.id),
          fetchMonthlyLeaderboard(),
        ]);
      }
    }
    fetchUser();
  }, [supabase, currentDate]);

  async function fetchMonthlyLeaderboard() {
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
        sortedLeaderboard.find((score) => score.user_id === user?.id) || null;

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
  }

  async function fetchQuizHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from("quiz_history")
        .select("*")
        .eq("user_id", userId)
        .order("played_at", { ascending: false });

      if (error) throw error;

      setResults(
        data.map((item) => ({
          game_id: item.game_id,
          quiz_name: item.quiz_name,
          total_score: item.total_score,
          played_at: item.played_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-4">
          Please log in to view your quiz history
        </h1>
        <Link
          href="/login"
          className="text-white hover:text-gray-200 bg-white/20 px-6 py-2 rounded-full transition duration-300 hover:bg-white/30"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz History</h1>
        <div className="text-gray-500 animate-pulse">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Monthly Leaderboard Card */}
      <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="backdrop-blur-sm bg-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-full transition duration-300"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-white">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}{" "}
              Leaderboard
            </h2>
            <button
              onClick={goToNextMonth}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-full transition duration-300"
            >
              →
            </button>
          </div>

          <div className="space-y-2">
            {monthlyLeaderboard.map((userScore, index) => (
              <div
                key={userScore.user_id}
                className={`bg-white/10 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center hover:bg-white/20 transition duration-300 ${
                  userScore.user_id === user?.id ? "ring-2 ring-yellow-400" : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold">
                    {userScore.rank}
                  </div>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20">
                    <Image
                      src={userScore.avatar_url}
                      alt={userScore.full_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-lg text-white font-medium">
                    {userScore.full_name}
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {userScore.total_score} pts
                </div>
              </div>
            ))}

            {currentUserScore && currentUserScore.rank > 9 && (
              <>
                <div className="text-center text-white/70 py-2">
                  <div className="text-2xl">•••</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center hover:bg-white/20 transition duration-300 ring-2 ring-yellow-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold">
                      {currentUserScore.rank}
                    </div>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20">
                      <Image
                        src={currentUserScore.avatar_url}
                        alt={currentUserScore.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-lg text-white font-medium">
                      {currentUserScore.full_name}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {currentUserScore.total_score} pts
                  </div>
                </div>
              </>
            )}

            {monthlyLeaderboard.length === 0 && (
              <div className="text-white/70 text-center py-4">
                No scores for this month
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz History Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Your Quiz History
          </h1>
          {results.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No quizzes played yet
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.game_id}
                  className="bg-gray-50 p-4 rounded-xl flex justify-between items-center hover:bg-gray-100 transition duration-300"
                >
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-900">
                      {result.quiz_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(result.played_at).toLocaleDateString()} at{" "}
                      {new Date(result.played_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-sky-600 bg-sky-100 px-4 py-1 rounded-full">
                    {result.total_score} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
