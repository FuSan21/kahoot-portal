"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { User, RealtimeChannel } from "@supabase/supabase-js";
import { Game, Participant, QuizSet, supabase } from "@/types/types";
import { AdminScreens } from "@/types/enums";
import Lobby from "./lobby";
import Quiz from "./quiz";
import Results from "./results";
import { toast } from "sonner";
import { preloadQuizImages } from "@/utils/imagePreloader";
import JitsiMeetSidebar from "@/app/components/JitsiMeetSidebar";
import { generateJWT } from "@/app/auth/jitsi/generateJwt";
import { useRouter } from "next/navigation";

import JitsiIcon from "@/app/components/icons/JitsiIcon";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";

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
  const panelRef = useRef<ImperativePanelHandle>(null);
  const [isButtonTransition, setIsButtonTransition] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [isMeetingClosed, setIsMeetingClosed] = useState(true);

  // Sync panel state with cache on mount
  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      const isCollapsed = panel.getSize() === 0;
      setIsPanelCollapsed(isCollapsed);
      // Only update meeting state if it's the initial load
      if (isMeetingClosed === true && !isCollapsed) {
        setIsMeetingClosed(false);
        // Refresh JWT to ensure Jitsi loads properly
        setJwt("");
        setTimeout(() => {
          fetchJWT();
        }, 0);
      }
    }
  }, [panelRef.current]); // Re-run when panel ref is available

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

  if (!isAuthorized) {
    return <div>Checking authorization...</div>;
  }

  const togglePanel = () => {
    const panel = panelRef.current;
    if (panel) {
      setIsButtonTransition(true);
      panel.isCollapsed() ? panel.expand() : panel.collapse();
    }
  };

  return (
    <PanelGroup
      autoSaveId="jitsi-panel-group"
      direction="horizontal"
      className="flex flex-grow"
    >
      <Panel
        minSize={20}
        className="bg-background flex flex-col items-center justify-center"
      >
        {renderScreen()}
      </Panel>
      <PanelResizeHandle className="coarse:flex-grow-0 coarse:flex-shrink-0 coarse:basis-2" />
      <div className="relative">
        <JitsiIcon
          className={`absolute top-1/2 -translate-y-1/2 -left-10 w-10 h-10 
            ${isMeetingClosed ? "bg-red-500" : "bg-sky-500"} 
            hover:${
              isMeetingClosed ? "bg-red-400" : "bg-sky-400"
            } cursor-pointer z-10 
            transition-all duration-1000 ease-in-out transform
            ${isPanelCollapsed ? "rotate-0" : "rotate-180"} 
            text-white rounded-full`}
          onClick={() => {
            if (isMeetingClosed) {
              setIsMeetingClosed(false);
              setJwt("");
              setTimeout(() => {
                fetchJWT();
              }, 0);
            }
            togglePanel();
          }}
        />
      </div>
      <Panel
        ref={panelRef}
        minSize={20}
        defaultSize={0}
        collapsible={true}
        collapsedSize={0}
        className={`bg-gray-800 ${
          isButtonTransition ? "transition-all duration-300 ease-in-out" : ""
        }`}
        onCollapse={() => {
          setIsPanelCollapsed(true);
          setTimeout(() => setIsButtonTransition(false), 300);
        }}
        onExpand={() => {
          setIsPanelCollapsed(false);
          setTimeout(() => setIsButtonTransition(false), 300);
        }}
      >
        <div className={`h-full ${isPanelCollapsed ? "invisible" : "visible"}`}>
          {jwt && !isMeetingClosed ? (
            <JitsiMeetSidebar
              jwt={jwt}
              roomName={quizSet?.id || "Kahoot Portal"}
              onReadyToClose={() => {
                if (panelRef.current && !panelRef.current.isCollapsed()) {
                  setIsButtonTransition(true);
                  panelRef.current.collapse();
                }
                setIsMeetingClosed(true);
                toast.info("Meeting closed");
              }}
            />
          ) : (
            <div>Loading meeting...</div>
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
}
