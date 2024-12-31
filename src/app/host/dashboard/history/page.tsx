"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { QuizResult, UserScore } from "@/types/quiz";
import MonthlyLeaderboard from "@/app/components/MonthlyLeaderboard";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Trophy } from "lucide-react";

export default function DashboardHistoryPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<UserScore[]>([]);
  const [currentUserScore, setCurrentUserScore] = useState<UserScore | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

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

      // Find current user's score only if they have played in this month
      const currentUserScore: UserScore | null =
        leaderboard.find((score: UserScore) => score.user_id === user?.id) ||
        null;

      setCurrentUserScore(currentUserScore);

      if (currentUserScore) {
        // Get top 9 users (leaving space for current user if needed)
        const top = leaderboard.slice(0, 9);

        // If current user is in top 9, show top 10
        if (currentUserScore.rank <= 9) {
          setMonthlyLeaderboard(leaderboard.slice(0, 10));
        } else {
          // If current user exists but not in top 9, show top 9 + current user
          setMonthlyLeaderboard(top);
        }
      } else {
        // If current user has no score for this month, just show top 10
        setMonthlyLeaderboard(leaderboard.slice(0, 10));
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

  const handleQuizClick = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Authentication Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Please log in to view your quiz history
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Monthly Leaderboard Component */}
      <MonthlyLeaderboard
        monthlyLeaderboard={monthlyLeaderboard}
        currentUserScore={currentUserScore}
        currentUserId={user.id}
        allowMonthNavigation={true}
        currentDate={currentDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onCurrentMonth={goToCurrentMonth}
      />

      {/* Quiz History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Your Quiz History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No quizzes played yet
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <Card
                  key={result.game_id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleQuizClick(result.game_id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium">{result.quiz_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.played_at).toLocaleDateString()} at{" "}
                        {new Date(result.played_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-lg font-bold bg-primary/10 text-primary px-4 py-1 rounded-full">
                      {result.total_score} pts
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
