import { useEffect, useState } from "react";
import { Participant, supabase } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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
      if (participant) return;

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
          {
            onConflict: "game_id,user_id",
          }
        )
        .select()
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (participantData) {
        setParticipant(participantData);
        onRegisterCompleted(participantData);
      }
    };

    const channel = supabase
      .channel(`game_${gameId}_participant`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          if (
            payload.eventType === "DELETE" &&
            payload.old.id === participant?.id
          ) {
            setParticipant(null);
            await registerParticipant();
          }
        }
      )
      .subscribe();

    registerParticipant();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, onRegisterCompleted, participant]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {participant
              ? `Welcome ${participant.nickname}!`
              : "Joining the game..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participant ? (
            <p className="text-muted-foreground text-center">
              You have been registered and your nickname should show up on the
              admin screen. Please sit back and wait until the game master
              starts the game.
            </p>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to game server...
            </div>
          )}
        </CardContent>
      </Card>

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
