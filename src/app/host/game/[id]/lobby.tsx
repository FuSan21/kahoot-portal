import { useState, useEffect } from "react";
import { Participant, supabase } from "@/types/types";
import { useQRCode } from "next-qrcode";
import { BASE_URL } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Users } from "lucide-react";

export default function Lobby({
  participants,
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
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Join Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Canvas
                text={gameLink}
                options={{
                  level: "M",
                  margin: 3,
                  scale: 4,
                  width: 200,
                }}
              />
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Players can join by scanning the QR code or using the game
                  link below
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="relative rounded bg-muted px-[0.5rem] py-[0.3rem] font-mono text-sm">
                    {gameLink}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onClickCopyGameLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Players ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[240px] pr-4">
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      <Avatar>
                        <AvatarImage
                          src={
                            participant.profile?.avatar_url || "/default.png"
                          }
                          alt={participant.nickname}
                        />
                        <AvatarFallback>
                          {participant.nickname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-grow text-sm">
                        {participant.nickname}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={onClickStartGame}
            disabled={!canStartGame}
          >
            Start Game
          </Button>
        </div>
      </div>

      {preloadProgress < 100 && (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Progress value={preloadProgress} className="mb-2" />
            <p className="text-center text-sm text-muted-foreground">
              Preloading images: {Math.round(preloadProgress)}%
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
