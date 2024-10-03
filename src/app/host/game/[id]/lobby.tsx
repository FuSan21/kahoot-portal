import React, { useState } from "react";
import { Participant, supabase } from "@/types/types";
import { useQRCode } from "next-qrcode";
import { BASE_URL } from "@/constants";
import { toast } from "sonner";

export default function Lobby({
  participants: participants,
  gameId,
}: {
  participants: Participant[];
  gameId: string;
}) {
  const { Canvas } = useQRCode();
  const gameLink = BASE_URL + `/game/${gameId}`;
  const [pin, setPin] = useState<number | null>(null);
  const [isPinSet, setIsPinSet] = useState(false);

  const onClickSetPin = async () => {
    if (pin === null || pin < 10000 || pin > 99999) {
      return toast.error("Please enter a 5-digit PIN");
    }
    const { data, error } = await supabase
      .from("games")
      .update({ pin: pin })
      .eq("id", gameId);
    if (error) {
      return toast.error(error.message);
    }
    setIsPinSet(true);
    toast.success("PIN set successfully!");
  };

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

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="flex flex-col md:flex-row justify-between m-auto bg-black p-4 md:p-12 w-full max-w-4xl">
        {!isPinSet ? (
          <div className="w-full">
            <input
              type="number"
              placeholder="Enter 5-digit PIN"
              value={pin || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 99999) {
                  setPin(value);
                }
              }}
              className="w-full p-2 mb-4 text-black"
              min="10000"
              max="99999"
            />
            <button
              className="mx-auto bg-white py-2 px-6 md:py-4 md:px-12 block text-black w-full md:w-auto"
              onClick={onClickSetPin}
            >
              Set PIN
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-between mt-4 md:mt-0">
              <div className="pl-0 md:pl-4 flex justify-center">
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
              <div className="text-white text-center mt-4 md:mt-0">
                <button onClick={onClickCopyGameLink}>Copy Game Link</button>
              </div>
            </div>
            <div className="w-full md:w-96 mb-4 md:mb-0">
              <div className="flex justify-start flex-wrap pb-4 max-h-40 md:max-h-60 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    className="text-xs sm:text-sm md:text-base lg:text-xl m-1 p-1 md:m-2 md:p-2 bg-green-500 rounded"
                    key={participant.id}
                  >
                    {participant.nickname}
                  </div>
                ))}
              </div>
              <button
                className="mx-auto bg-white py-2 px-6 md:py-4 md:px-12 block text-black w-full md:w-auto"
                onClick={onClickStartGame}
              >
                Start Game
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
