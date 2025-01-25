import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GameResult } from "@/types/types";
import { TrophyIcon } from "lucide-react";

interface DetailedGameResult extends GameResult {
  scores: number[];
  profiles: {
    profiles: {
      avatar_url: string | null;
    } | null;
  } | null;
}

interface GameLeaderboardProps {
  results: DetailedGameResult[];
  currentParticipantId?: string;
}

export default function GameLeaderboard({
  results,
  currentParticipantId,
}: GameLeaderboardProps) {
  return (
    <Card className="w-full max-w-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <TrophyIcon className="h-6 w-6" />
          Game Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => {
            // Get all question scores (all except last if there's a bonus)
            const questionScores =
              result.scores.length > 1
                ? result.scores.slice(0, -1)
                : result.scores;
            // Get bonus score (last element if it exists and scores length > questions length)
            const bonusScore =
              result.scores.length > questionScores.length
                ? result.scores[result.scores.length - 1]
                : 0;

            return (
              <div
                key={result.participant_id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-colors",
                  currentParticipantId === result.participant_id
                    ? "bg-primary/10"
                    : "bg-muted/50",
                  "relative overflow-hidden"
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-muted">
                  {result.profiles?.profiles?.avatar_url ? (
                    <img
                      src={result.profiles.profiles.avatar_url}
                      alt={result.nickname || "User"}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                      {(result.nickname || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name and Scores */}
                <div className="flex-grow min-w-0">
                  <div className="font-medium truncate">
                    {result.nickname || "Anonymous"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {questionScores.map((score, i) => (
                      <span key={i} className="mr-2">
                        Q{i + 1}: {score}
                      </span>
                    ))}
                    {bonusScore > 0 && (
                      <span className="mr-2 text-green-600 font-medium">
                        Bonus: +{bonusScore}
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Score */}
                <div className="flex-shrink-0 text-lg font-bold bg-primary/10 text-primary px-4 py-1 rounded-full">
                  {result.total_score} pts
                </div>

                {/* Medal for top 3 */}
                {index < 3 && (
                  <div
                    className={cn(
                      "absolute -right-8 top-0 w-24 h-6 rotate-45 flex items-center justify-center text-white text-xs",
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : "bg-amber-600"
                    )}
                  >
                    {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
