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
import SocialBonusSubmission from "@/app/components/SocialBonusSubmission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailedGameResult extends GameResult {
  scores: number[];
  profiles: {
    profiles: {
      avatar_url: string | null;
    } | null;
  } | null;
}

interface QuizDetails {
  name: string;
  social_share_link: string | null;
  social_bonus_points: number | null;
}

interface ResultsProps {
  participant: Participant;
  gameId: string;
}

export default function Results({ participant, gameId }: ResultsProps) {
  const [personalResult, setPersonalResult] =
    useState<DetailedGameResult | null>(null);
  const [allResults, setAllResults] = useState<DetailedGameResult[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<UserScore[]>([]);
  const [currentUserScore, setCurrentUserScore] = useState<UserScore | null>(
    null
  );
  const [currentDate] = useState(new Date());
  const { width, height } = useWindowSize();
  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);

  useEffect(() => {
    const getQuizDetails = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("quiz_set_id")
        .eq("id", gameId)
        .single();

      if (gameError || !gameData) {
        console.error("Error fetching game:", gameError);
        return;
      }

      const { data: quizData, error: quizError } = await supabase
        .from("quiz_sets")
        .select("name, social_share_link, social_bonus_points")
        .eq("id", gameData.quiz_set_id)
        .single();

      if (quizError || !quizData) {
        console.error("Error fetching quiz details:", quizError);
        return;
      }

      setQuizDetails(quizData);
    };

    getQuizDetails();
  }, [gameId]);

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

      setAllResults(formattedResults as DetailedGameResult[]);
      const personal = formattedResults?.find(
        (r) => r.participant_id === participant.id
      );
      if (personal) {
        setPersonalResult(personal as DetailedGameResult);
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

        // Show top 10 for player view
        setMonthlyLeaderboard(leaderboard.slice(0, 10));

        // Find current user's score
        if (participant.user_id) {
          const userScore = leaderboard.find(
            (score) => score.user_id === participant.user_id
          );
          if (userScore) {
            setCurrentUserScore(userScore);
          }
        }
      } catch (error) {
        console.error("Error fetching monthly leaderboard:", error);
      }
    };

    fetchMonthlyLeaderboard();
  }, [currentDate, participant.user_id]);

  return (
    <div className="relative min-h-screen bg-background">
      <Confetti
        width={width}
        height={height}
        recycle={true}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 0 }}
      />
      <div className="flex flex-col items-center p-4 relative z-10 max-w-7xl mx-auto">
        {/* Quiz Name and Personal Score */}
        <Card className="w-full max-w-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              {quizDetails?.name || "Quiz Results"}
            </CardTitle>
          </CardHeader>
          {personalResult && (
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {personalResult.total_score} points
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Your Score
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Social Media Bonus */}
        {(quizDetails?.social_bonus_points ?? 0) > 0 && quizDetails && (
          <div className="w-full max-w-2xl mb-8">
            <SocialBonusSubmission
              gameId={gameId}
              participantId={participant.id}
              bonusPoints={quizDetails.social_bonus_points!}
            />
          </div>
        )}

        {/* Game Results */}
        <GameLeaderboard
          results={allResults}
          currentParticipantId={participant.id}
        />

        {/* Monthly Leaderboard */}
        {participant.user_id && (
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
        )}
      </div>
    </div>
  );
}
