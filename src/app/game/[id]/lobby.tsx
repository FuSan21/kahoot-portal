import { Participant, supabase } from "@/types/types";
import { FormEvent, useEffect, useState } from "react";
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
  const [pin, setPin] = useState<number | null>(null);
  const [isPinVerified, setIsPinVerified] = useState(false);

  useEffect(() => {
    const fetchParticipant = async () => {
      let userId: string | null = null;

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionData.session) {
        userId = sessionData.session?.user.id ?? null;
      } else {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) console.error(error);
        userId = data?.user?.id ?? null;
      }

      if (!userId) {
        return;
      }

      const { data: participantData, error } = await supabase
        .from("participants")
        .select()
        .eq("game_id", gameId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return toast.error(error.message);
      }

      if (participantData) {
        setParticipant(participantData);
        onRegisterCompleted(participantData);
      }
    };

    fetchParticipant();
  }, [gameId, onRegisterCompleted]);

  const verifyPin = async () => {
    if (pin === null || pin < 10000 || pin > 99999) {
      return toast.error("Please enter a 5-digit PIN");
    }

    const { data, error } = await supabase
      .from("games")
      .select("pin")
      .eq("id", gameId)
      .single();

    if (error) {
      return toast.error("Error verifying PIN");
    }

    if (data.pin === pin) {
      setIsPinVerified(true);
    } else {
      toast.error("Incorrect PIN");
    }
  };

  return (
    <div className="bg-green-500 flex flex-col justify-center items-center min-h-screen">
      <div className="bg-black p-12 mb-4">
        {!isPinVerified ? (
          <div>
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
              className="p-2 w-full border border-black text-black mb-4"
              min="10000"
              max="99999"
            />
            <button onClick={verifyPin} className="w-full py-2 bg-green-500">
              Verify PIN
            </button>
          </div>
        ) : !participant ? (
          <Register
            gameId={gameId}
            onRegisterCompleted={(participant) => {
              onRegisterCompleted(participant);
              setParticipant(participant);
            }}
          />
        ) : (
          <div className="text-white max-w-md">
            <h1 className="text-xl pb-4">Welcome {participant.nickname}！</h1>
            <p>
              You have been registered and your nickname should show up on the
              admin screen. Please sit back and wait until the game master
              starts the game.
            </p>
          </div>
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

function Register({
  onRegisterCompleted,
  gameId,
}: {
  onRegisterCompleted: (player: Participant) => void;
  gameId: string;
}) {
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);

    if (!nickname) {
      return;
    }
    const { data: participant, error } = await supabase
      .from("participants")
      .insert({ nickname, game_id: gameId })
      .select()
      .single();

    if (error) {
      setSending(false);

      return toast.error(error.message);
    }

    onRegisterCompleted(participant);
  };

  const [nickname, setNickname] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <form onSubmit={(e) => onFormSubmit(e)}>
      <input
        className="p-2 w-full border border-black text-black"
        type="text"
        onChange={(val) => setNickname(val.currentTarget.value)}
        placeholder="Nickname"
        maxLength={20}
      />
      <button disabled={sending} className="w-full py-2 bg-green-500 mt-4">
        Join
      </button>
    </form>
  );
}
