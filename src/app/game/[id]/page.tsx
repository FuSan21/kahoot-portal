"use client";

import React, { useEffect, useState, useCallback } from "react";
import { User, RealtimeChannel } from "@supabase/supabase-js";
import { Game, Participant, QuizSet, supabase } from "@/types/types";
import { Screens } from "@/types/enums";
import Lobby from "./lobby";
import Quiz from "./quiz";
import Results from "./results";
import { toast } from "sonner";
import { preloadQuizImages } from "@/utils/imagePreloader";
import JitsiMeetSidebar from "@/app/components/JitsiMeetSidebar";
import { generateJWT } from "@/app/auth/jitsi/generateJwt";

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string };
}) {
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string>("");
  const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.lobby);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [quizSet, setQuizSet] = useState<QuizSet>();
  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to fetch user information.");
      }
    };
    fetchUser();
  }, [gameId]);
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

  const handleGameUpdate = useCallback((payload: { new: Game }) => {
    const game = payload.new;
    setCurrentQuestionSequence(game.current_question_sequence);
    setIsAnswerRevealed(game.is_answer_revealed);
    setCurrentScreen(game.phase as Screens);
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupGameListener = async () => {
      channel = supabase
        .channel("game_participant")
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

  const onRegisterCompleted = (newParticipant: Participant) => {
    setParticipant(newParticipant);
  };

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
          moderator: false,
          room: "*",
        });

        setJwt(token);
      } catch (error) {
        toast.error("Failed to generate JWT");
      }
    };

    fetchJWT();
  }, [user, quizSet]);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screens.lobby:
        return (
          <Lobby
            gameId={gameId}
            onRegisterCompleted={onRegisterCompleted}
            preloadProgress={preloadProgress}
          />
        );
      case Screens.quiz:
        return quizSet?.questions ? (
          <Quiz
            question={quizSet.questions[currentQuestionSequence]}
            quiz={quizSet.id}
            questionCount={quizSet.questions.length}
            participantId={participant!.id}
            isAnswerRevealed={isAnswerRevealed}
            gameId={gameId}
          />
        ) : (
          <div>Loading quiz data...</div>
        );
      case Screens.results:
        return <Results participant={participant!} gameId={gameId} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-grow">
      <div className="flex-grow bg-green-500 flex flex-col items-center justify-center">
        {renderScreen()}
      </div>
      <div className="w-[40vw] min-w-20 bg-gray-800 flex flex-col">
        {jwt ? (
          <JitsiMeetSidebar
            jwt={jwt}
            roomName={quizSet?.name || "AGT Quiz Portal"}
            avatar={user?.user_metadata.avatar_url}
          />
        ) : (
          <div>Loading meeting...</div>
        )}
      </div>
    </div>
  );
}
