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
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex justify-between m-auto bg-black p-12">
        <div className="w-96">
          <div className="flex justify-start flex-wrap pb-4">
            {participants.map((participant) => (
              <div
                className="text-xl m-2 p-2 bg-green-500"
                key={participant.id}
              >
                {participant.nickname}
              </div>
            ))}
          </div>

          <button
            className="mx-auto bg-white py-4 px-12 block text-black"
            onClick={onClickStartGame}
          >
            Start Game
          </button>
        </div>
        <div className="flex flex-col justify-between">
          <div className="pl-4">
            {/* <img src="/qr.png" alt="QR code" /> */}
            <Canvas
              text={gameLink}
              options={{
                errorCorrectionLevel: "M",
                margin: 3,
                scale: 4,
                width: 400,
              }}
            />
          </div>
          <div className="text-white text-center">
            <button onClick={onClickCopyGameLink}>Copy Game Link</button>
          </div>
        </div>
      </div>
    </div>
  );
}
