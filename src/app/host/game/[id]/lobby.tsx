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
    <div className="h-full flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Game Lobby
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col justify-between">
              <Card className="p-4">
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
                <Button
                  onClick={onClickCopyGameLink}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Game Link
                </Button>
              </Card>
            </div>

            <div className="flex-1 min-w-[300px]">
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
                                participant.profile?.avatar_url ||
                                "/default.png"
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
                className="mt-4 w-full"
                size="lg"
                onClick={onClickStartGame}
                disabled={!canStartGame}
              >
                Start Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {preloadProgress < 100 && (
        <Card className="w-full max-w-md mt-4">
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
