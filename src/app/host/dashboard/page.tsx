"use client";

import { QuizSet, supabase } from "@/types/types";
import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getQuizSets = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          toast.error("Failed to fetch user");
          return;
        }

        const { data, error } = await supabase
          .from("quiz_sets")
          .select(`*, questions(*, choices(*))`)
          .or(`is_public.eq.true,created_by.eq.${user?.id}`)
          .order("created_at", { ascending: false });
        if (error) {
          toast.error("Failed to fetch quiz sets");
          return;
        }
        setQuizSet(data);
      } catch (error) {
        toast.error("An error occurred while fetching quiz sets");
      } finally {
        setLoading(false);
      }
    };
    getQuizSets();
  }, []);

  const startGame = async (quizSetId: string) => {
    try {
      const { data, error } = await supabase
        .from("games")
        .insert({
          quiz_set_id: quizSetId,
        })
        .select()
        .single();
      if (error) {
        console.error(error);
        toast.error("Failed to start game");
        return;
      }

      const gameId = data.id;
      window.open(`/host/game/${gameId}`, "_self", "noopener,noreferrer");
    } catch (error) {
      toast.error("An error occurred while starting the game");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="flex-row gap-4 items-start space-y-0">
              <Skeleton className="h-20 w-20 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {quizSet.map((quizSet) => (
        <Card key={quizSet.id} className="flex flex-col">
          <CardHeader className="flex-row gap-4 items-start space-y-0">
            <Image
              className="h-20 w-20 object-cover rounded flex-shrink-0"
              src={
                quizSet.image
                  ? `/api/getImage?path=${quizSet.id}/${quizSet.image}`
                  : "/default.png"
              }
              alt={quizSet.name}
              width={80}
              height={80}
            />
            <div className="flex-1 space-y-1">
              <CardTitle className="text-lg break-words">
                {quizSet.name}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <HelpCircle className="mr-1 h-4 w-4" />
                {quizSet.questions.length} questions
              </div>
            </div>
          </CardHeader>
          <CardFooter className="mt-auto pt-6">
            <Button className="w-full" onClick={() => startGame(quizSet.id)}>
              <PlayIcon className="mr-2 h-4 w-4" />
              Start Game
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
