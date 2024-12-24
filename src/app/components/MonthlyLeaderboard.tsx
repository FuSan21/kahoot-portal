import Image from "next/image";
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
  const isCurrentMonth = (date: Date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  return (
    <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
      <div className="backdrop-blur-sm bg-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          {allowMonthNavigation && (
            <button
              onClick={onPreviousMonth}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-full transition duration-300"
            >
              ←
            </button>
          )}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}{" "}
              Leaderboard
            </h2>
            {allowMonthNavigation && !isCurrentMonth(currentDate) && (
              <button
                onClick={onCurrentMonth}
                className="mt-2 text-white/80 hover:text-white text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition duration-300"
              >
                Back to Current Month
              </button>
            )}
          </div>
          {allowMonthNavigation && (
            <button
              onClick={onNextMonth}
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-full transition duration-300"
            >
              →
            </button>
          )}
        </div>

        <div className="space-y-2">
          {monthlyLeaderboard.map((userScore, index) => (
            <div
              key={userScore.user_id}
              className={`bg-white/10 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center hover:bg-white/20 transition duration-300 ${
                userScore.user_id === currentUserId
                  ? "ring-2 ring-yellow-400"
                  : ""
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
  );
}
