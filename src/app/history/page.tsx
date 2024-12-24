"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface QuizResult {
  game_id: string;
  quiz_name: string;
  total_score: number;
  played_at: string;
}

export default function HistoryPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchQuizHistory(user.id);
      }
    }
    fetchUser();
  }, [supabase]);

  async function fetchQuizHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from("quiz_history")
        .select("*")
        .order("total_score", { ascending: false });

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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">
          Please log in to view your quiz history
        </h1>
        <Link href="/login" className="text-blue-500 hover:text-blue-700">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Quiz History</h1>
        <div className="text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Quiz History</h1>
        <div className="text-gray-500">No quizzes played yet</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Quiz History</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {results.map((result) => (
            <div
              key={result.game_id}
              className="p-4 flex justify-between items-center hover:bg-gray-50"
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
              <div className="text-lg font-medium text-green-600">
                {result.total_score} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
