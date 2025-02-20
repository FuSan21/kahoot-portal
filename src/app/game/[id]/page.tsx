"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { User, RealtimeChannel } from "@supabase/supabase-js";
import { Game, Participant, QuizSet, supabase } from "@/types/types";
import { Screens } from "@/types/enums";
import Lobby from "./lobby";
import Quiz from "./quiz";
import Results from "./results";
import { toast } from "@/hooks/use-toast";
import { preloadQuizImages } from "@/utils/imagePreloader";
import JitsiMeetSidebar from "@/app/components/JitsiMeetSidebar";
import { generateJWT } from "@/app/auth/jitsi/generateJwt";

import JitsiIcon from "@/app/components/icons/JitsiIcon";

export default function Home(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);

  const { id: gameId } = params;

  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string>("");
  const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.lobby);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [quizSet, setQuizSet] = useState<QuizSet>();
  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isMeetingClosed, setIsMeetingClosed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isMeetingClosed");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isMeetingMinimized, setIsMeetingMinimized] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(true);

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

  useEffect(() => {
    fetchJWT();
  }, [user, quizSet]);

  useEffect(() => {
    localStorage.setItem("isMeetingClosed", JSON.stringify(isMeetingClosed));
  }, [isMeetingClosed]);

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
