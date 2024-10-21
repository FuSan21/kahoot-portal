import { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";
import { toast } from "sonner";

export default function Lobby({
  gameId,
  onRegisterCompleted,
  preloadProgress,
}: {
  gameId: string;
  onRegisterCompleted: (participant: Participant) => void;
  preloadProgress: number;
}) {
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    const registerParticipant = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error(sessionError);
        toast.error("Error fetching session");
        return;
      }

      if (!sessionData.session) {
        toast.error("Please sign in to join the game");
        return;
      }

      const userId = sessionData.session.user.id;
      const nickname = sessionData.session.user.user_metadata.name;

      const { data: participantData, error } = await supabase
        .from("participants")
        .upsert(
          { game_id: gameId, user_id: userId, nickname },
          { onConflict: "game_id,user_id", ignoreDuplicates: false }
        )
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      setParticipant(participantData);
      onRegisterCompleted(participantData);
    };

    registerParticipant();
  }, [gameId, onRegisterCompleted]);

  return (
    <div className="bg-green-500 flex-grow flex flex-col items-center justify-center">
      <div className="bg-black p-12 mb-4">
        {participant ? (
          <div className="text-white max-w-md">
            <h1 className="text-xl pb-4">Welcome {participant.nickname}！</h1>
            <p>
              You have been registered and your nickname should show up on the
              admin screen. Please sit back and wait until the game master
              starts the game.
            </p>
          </div>
        ) : (
          <div className="text-white">Joining the game...</div>
        )}
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
