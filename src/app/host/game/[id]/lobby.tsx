import { useState, useEffect } from "react";
import { Participant, supabase } from "@/types/types";
import { useQRCode } from "next-qrcode";
import { BASE_URL } from "@/constants";
import { toast } from "sonner";

export default function Lobby({
  participants: participants,
  gameId,
  preloadProgress,
  isAuthorized,
}: {
  participants: Participant[];
  gameId: string;
  preloadProgress: number;
  isAuthorized: boolean;
}) {
  const { Canvas } = useQRCode();
  const gameLink = BASE_URL + `/game/${gameId}`;
  const [canStartGame, setCanStartGame] = useState(false);

  useEffect(() => {
    if (preloadProgress === 100) {
      setCanStartGame(true);
    }
  }, [preloadProgress]);

  const onClickCopyGameLink = () => {
    navigator.clipboard
      .writeText(gameLink)
      .then(() => {
        toast.success("Game link copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Failed to copy game link to clipboard!");
        console.error("Failed to copy: ", err);
      });
  };

  const onClickStartGame = async () => {
    const { data, error } = await supabase
      .from("games")
      .update({ phase: "quiz" })
      .eq("id", gameId);
    if (error) {
      return toast.error(error.message);
    }
    toast.success("Game started successfully!");
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="bg-blue-500 flex-grow flex flex-col items-center justify-center">
      <div className="flex flex-col m-auto bg-black p-4 md:p-12 w-full max-w-4xl">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col justify-between">
            <div className="flex justify-center">
              <Canvas
                text={gameLink}
                options={{
                  errorCorrectionLevel: "M",
                  margin: 3,
                  scale: 4,
                  width: 200,
                }}
              />
            </div>
            <div className="text-white text-center mt-4">
              <button onClick={onClickCopyGameLink}>Copy Game Link</button>
            </div>
          </div>
          <div className="w-96">
            <div className="max-h-60 overflow-y-auto bg-white rounded-lg shadow">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center p-2 border-b border-gray-200 last:border-b-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={participant.profile?.avatar_url || "/default.png"}
                    alt={participant.nickname}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <span className="text-sm md:text-base lg:text-lg">
                    {participant.nickname}
                  </span>
                </div>
              ))}
            </div>
            <button
              className={`mt-4 mx-auto py-2 px-6 md:py-4 md:px-12 block text-black w-full md:w-auto ${
                canStartGame
                  ? "bg-white hover:bg-gray-200"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={onClickStartGame}
              disabled={!canStartGame}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>

      {preloadProgress < 100 && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-white rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${preloadProgress}%` }}
            ></div>
          </div>
          <p className="text-center text-white mt-2">
            Preloading images: {Math.round(preloadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
}
