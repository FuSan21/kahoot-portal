interface GameResult {
  participant_id: string | null;
  nickname: string | null;
  total_score: number | null;
  scores: number[];
  profiles?: {
    profiles: {
      avatar_url: string | null;
    } | null;
  } | null;
}

interface GameLeaderboardProps {
  results: GameResult[];
  currentParticipantId?: string;
}

export default function GameLeaderboard({
  results,
  currentParticipantId,
}: GameLeaderboardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-400 via-sky-500 to-cyan-600 rounded-2xl shadow-xl overflow-hidden mb-8 w-full max-w-2xl">
      <div className="backdrop-blur-sm bg-white/10 p-6">
        <h3 className="text-xl text-white mb-4 text-center">
          Quiz Leaderboard
        </h3>
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={result.participant_id}
              className={`bg-white/10 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center hover:bg-white/20 transition duration-300 ${
                result.participant_id === currentParticipantId
                  ? "ring-2 ring-yellow-400"
                  : ""
              } ${index < 3 ? "shadow-xl font-bold" : ""}`}
            >
              <div
                className={`pr-4 text-white ${
                  index < 3 ? "text-3xl" : "text-l"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex items-center flex-grow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    result.profiles?.profiles?.avatar_url ||
                    "/default-avatar.png"
                  }
                  alt={`${result.nickname}'s avatar`}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div
                  className={`font-bold text-white ${
                    index < 3 ? "text-xl sm:text-2xl" : "text-lg"
                  }`}
                >
                  {result.nickname}
                  {result.participant_id === currentParticipantId && " (You)"}
                </div>
              </div>
              <div className="pl-2 text-right">
                <div className="text-xl font-bold text-white">
                  {result.total_score || 0}
                </div>
                <div className="text-sm text-white/80">
                  ({result.scores.join("+")})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
