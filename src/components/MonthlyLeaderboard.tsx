import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";
import { UserScore } from "@/types/quiz";

interface MonthlyLeaderboardProps {
  monthlyLeaderboard: UserScore[];
  currentUserScore: UserScore | null;
  currentUserId: string;
  allowMonthNavigation: boolean;
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
}

export default function MonthlyLeaderboard({
  monthlyLeaderboard,
  currentUserScore,
  currentUserId,
  allowMonthNavigation,
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
}: MonthlyLeaderboardProps) {
  const monthYear = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Monthly Leaderboard
          </CardTitle>
          {allowMonthNavigation && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCurrentMonth}
                className="h-8"
              >
                Current
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onNextMonth}
                className="h-8 w-8"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">{monthYear}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyLeaderboard.map((score) => (
            <div
              key={score.user_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg transition-colors",
                currentUserId === score.user_id
                  ? "bg-primary/10"
                  : "bg-muted/50",
                "relative overflow-hidden"
              )}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                {score.rank}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-muted">
                {score.avatar_url ? (
                  <img
                    src={score.avatar_url}
                    alt={score.full_name || "User"}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                    {(score.full_name || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-grow min-w-0">
                <div className="font-medium truncate">
                  {score.full_name || "Anonymous"}
                </div>
              </div>

              {/* Total Score */}
              <div className="flex-shrink-0 text-lg font-bold bg-primary/10 text-primary px-4 py-1 rounded-full">
                {score.total_score} pts
              </div>

              {/* Medal for top 3 */}
              {score.rank <= 3 && (
                <div
                  className={cn(
                    "absolute -right-8 top-0 w-24 h-6 rotate-45 flex items-center justify-center text-white text-xs",
                    score.rank === 1
                      ? "bg-yellow-500"
                      : score.rank === 2
                      ? "bg-gray-400"
                      : "bg-amber-600"
                  )}
                >
                  {score.rank === 1 ? "1st" : score.rank === 2 ? "2nd" : "3rd"}
                </div>
              )}
            </div>
          ))}

          {/* Current User Score (if not in top 10) */}
          {currentUserScore &&
            !monthlyLeaderboard.some(
              (score) => score.user_id === currentUserScore.user_id
            ) && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">
                      Your Position
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg bg-primary/10"
                  )}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {currentUserScore.rank}
                  </div>
                  <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-muted">
                    {currentUserScore.avatar_url ? (
                      <img
                        src={currentUserScore.avatar_url}
                        alt={currentUserScore.full_name || "User"}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                        {(currentUserScore.full_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-medium truncate">
                      {currentUserScore.full_name || "Anonymous"}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-lg font-bold bg-primary/10 text-primary px-4 py-1 rounded-full">
                    {currentUserScore.total_score} pts
                  </div>
                </div>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
