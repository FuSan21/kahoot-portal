"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { User, RealtimeChannel } from "@supabase/supabase-js";
import { Game, Participant, QuizSet, supabase } from "@/types/types";
import { AdminScreens } from "@/types/enums";
import Lobby from "./lobby";
import Quiz from "./quiz";
import Results from "./results";
import { toast } from "@/hooks/use-toast";
import { preloadQuizImages } from "@/utils/imagePreloader";
import JitsiMeetSidebar from "@/app/components/JitsiMeetSidebar";
import { generateJWT } from "@/app/auth/jitsi/generateJwt";
import { useRouter } from "next/navigation";

import JitsiIcon from "@/app/components/icons/JitsiIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);

  const { id: gameId } = params;

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AdminScreens>(
    AdminScreens.lobby
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [quizSet, setQuizSet] = useState<QuizSet>();
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0);
  const [isMeetingClosed, setIsMeetingClosed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isMeetingClosed");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isMeetingMinimized, setIsMeetingMinimized] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(true);

  const fetchQuizSetData = useCallback(async () => {
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select()
        .eq("id", gameId)
        .single();

      if (gameError || !gameData) {
        throw new Error(gameError?.message || "Game data not found");
      }

      const { data: quizSetData, error: quizSetError } = await supabase
        .from("quiz_sets")
        .select(`*, questions(*, choices(*))`)
        .eq("id", gameData.quiz_set_id)
        .order("order", { ascending: true, referencedTable: "questions" })
        .single();

      if (quizSetError || !quizSetData) {
        throw new Error(quizSetError?.message || "Quiz set data not found");
      }

      setQuizSet(quizSetData as QuizSet);
      await preloadQuizImages(quizSetData.id, setPreloadProgress);
    } catch (error) {
      console.error("Error fetching quiz set data:", error);
      toast.error("Failed to load quiz data");
    }
  }, [gameId]);

  const updateQuestionStartTime = useCallback(async () => {
    const newStartTime = new Date().toISOString();
    const { error } = await supabase
      .from("games")
      .update({ current_question_start_time: newStartTime })
      .eq("id", gameId);

    if (error) {
      console.error("Error updating current_question_start_time:", error);
    }
  }, [gameId]);

  const handleGameUpdate = useCallback(
    (payload: { new: Game }) => {
      const game = payload.new;
      setCurrentQuestionSequence(game.current_question_sequence);
      setCurrentScreen(game.phase as AdminScreens);

      if (game.phase === "quiz" && game.current_question_start_time === null) {
        updateQuestionStartTime();
      }
    },
    [updateQuestionStartTime]
  );

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupGameListener = async () => {
      const { data: initialParticipants, error } = await supabase
        .from("participants")
        .select(
          `
          *,
          profile:profiles(avatar_url)
        `
        )
        .eq("game_id", gameId)
        .order("created_at");

      if (error) {
        console.error("Error fetching participants:", error);
        toast.error("Failed to fetch participants");
        return;
      }

      setParticipants(initialParticipants || []);

      channel = supabase
        .channel("game")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "participants",
            filter: `game_id=eq.${gameId}`,
          },
          async (payload) => {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("id", payload.new.user_id)
              .single();

            if (profileError) {
              console.error("Error fetching profile:", profileError);
              return;
            }

            setParticipants((current) => [
              ...current,
              {
                ...payload.new,
                profile: {
                  avatar_url: profileData?.avatar_url || null,
                },
              } as Participant,
            ]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId}`,
          },
          handleGameUpdate
        )
        .subscribe();

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select()
        .eq("id", gameId)
        .single();

      if (gameError) {
        toast.error("Failed to fetch game data");
        console.error(gameError);
        return;
      }

      handleGameUpdate({ new: gameData });
    };

    fetchQuizSetData();
    setupGameListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameId, fetchQuizSetData, handleGameUpdate]);

  const renderScreen = () => {
    switch (currentScreen) {
      case AdminScreens.lobby:
        return (
          <Lobby
            participants={participants}
            gameId={gameId}
            preloadProgress={preloadProgress}
            isAuthorized={isAuthorized}
          />
        );
      case AdminScreens.quiz:
        return quizSet?.questions ? (
          <Quiz
            question={quizSet.questions[currentQuestionSequence]}
            quiz={quizSet.id}
            questionCount={quizSet.questions.length}
            gameId={gameId}
            participants={participants}
            isAuthorized={isAuthorized}
          />
        ) : (
          <div>Loading quiz data...</div>
        );
      case AdminScreens.result:
        return (
          <Results
            participants={participants}
            quizSet={quizSet!}
            gameId={gameId}
            isAuthorized={isAuthorized}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const checkAuthorization = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to access this page");
        router.push("/login");
        return;
      }

      const { data: game, error } = await supabase
        .from("games")
        .select("host_user_id")
        .eq("id", gameId)
        .single();

      if (error || !game) {
        toast.error("Failed to fetch game data");
        router.push("/");
        return;
      }

      if (game.host_user_id !== user.id) {
        toast.error("You are not authorized to host this game");
        router.push("/"); // Redirect to home or error page
        return;
      }
      setUser(user);
      setIsAuthorized(true);
    };

    checkAuthorization();
  }, [gameId, router]);

  const fetchJWT = async () => {
    if (!user || !user.user_metadata || !quizSet) {
      return;
    }
    try {
      const token = await generateJWT({
        userId: user.id,
        name: user.user_metadata.name,
        avatar: user.user_metadata.avatar_url,
        email: user.email || null,
        moderator: true,
        room: "*",
      });

      setJwt(token);
    } catch (error) {
      toast.error("Failed to generate JWT");
    }
  };

  useEffect(() => {
    fetchJWT();
  }, [user, quizSet]);

  useEffect(() => {
    localStorage.setItem("isMeetingClosed", JSON.stringify(isMeetingClosed));
  }, [isMeetingClosed]);

  if (!isAuthorized) {
    return (
      <div className="md:h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center space-x-4 py-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-8 w-[250px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="md:h-full flex flex-col items-center justify-center bg-background p-4">
      {renderScreen()}
      {(!isMeetingOpen || isMeetingClosed) && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[51]">
          <JitsiIcon
            className={`w-10 h-10 
              ${isMeetingClosed ? "bg-red-500" : "bg-sky-500"} 
              hover:${isMeetingClosed ? "bg-red-400" : "bg-sky-400"} 
              cursor-pointer
              transition-all duration-300 ease-in-out transform
              rotate-0
              text-white rounded-l-full`}
            onClick={() => {
              if (isMeetingClosed) {
                setIsMeetingClosed(false);
                setJwt("");
                setTimeout(() => {
                  fetchJWT();
                }, 0);
              }
              setIsMeetingOpen(true);
              setIsMeetingMinimized(false);
            }}
          />
        </div>
      )}
      {jwt && !isMeetingClosed && (
        <JitsiMeetSidebar
          jwt={jwt}
          roomName={quizSet?.id || "Kahoot Portal"}
          isOpen={isMeetingOpen}
          isMinimized={isMeetingMinimized}
          onOpenChange={setIsMeetingOpen}
          onMinimizeChange={setIsMeetingMinimized}
          onReadyToClose={() => {
            setIsMeetingClosed(true);
            toast.info("Meeting closed");
          }}
          isMeetingClosed={isMeetingClosed}
          onJitsiIconClick={() => {
            if (isMeetingOpen && !isMeetingMinimized) {
              setIsMeetingMinimized(true);
            } else {
              setIsMeetingOpen(true);
              setIsMeetingMinimized(false);
            }
          }}
        />
      )}
    </div>
  );
}
