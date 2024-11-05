"use client";

import { Game, Participant, QuizSet, supabase } from "@/types/types";
import { AdminScreens } from "@/types/enums";
import { useEffect, useState, useCallback } from "react";
import Lobby from "./lobby";
import Quiz from "./quiz";
import Results from "./results";
import { toast } from "sonner";
import { preloadQuizImages } from "@/utils/imagePreloader";
import { RealtimeChannel, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import JitsiMeetSidebar from "@/app/components/JitsiMeetSidebar";
import { generateJWT } from "@/app/auth/jitsi/generateJwt";

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string };
}) {
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

  useEffect(() => {
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

    fetchJWT();
  }, [user, quizSet]);

  if (!isAuthorized) {
    return <div>Checking authorization...</div>;
  }

  return (
    <div className="flex flex-grow">
      <div className="flex-grow bg-green-500 flex flex-col items-center justify-center">
        {renderScreen()}
      </div>
      <div className="w-[40vw] min-w-20 bg-gray-800 flex flex-col">
        {jwt ? (
          <JitsiMeetSidebar
            jwt={jwt}
            roomName={quizSet?.name || "Kahoot Portal"}
            avatar={user?.user_metadata.avatar_url}
          />
        ) : (
          <div>Loading meeting...</div>
        )}
      </div>
    </div>
  );
}
