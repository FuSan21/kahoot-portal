import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from "@/constants";
import {
  Choice,
  Question,
  supabase,
  Game,
  Participant,
  Answer,
} from "@/types/types";
import CheckIcon from "@/app/components/icons/CheckIcon";
import CrossIcon from "@/app/components/icons/CrossIcon";
import { getPreloadedImage } from "@/utils/imagePreloader";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ColorFormat,
  CountdownCircleTimer,
} from "react-countdown-circle-timer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ParticipantsList from "@/components/ParticipantsList";

export default function Quiz({
  question: question,
  quiz: quiz,
  questionCount: questionCount,
  participantId: playerId,
  isAnswerRevealed: isAnswerRevealed,
  gameId: gameId,
}: {
  question: Question;
  quiz: string;
  questionCount: number;
  participantId: string;
  isAnswerRevealed: boolean;
  gameId: string;
}) {
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null);
  const [hasShownChoices, setHasShownChoices] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    setChosenChoice(null);
    setHasShownChoices(false);
    setAnswers([]);
  }, [question.id]);

  useEffect(() => {
    const fetchGameState = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("current_question_start_time")
        .eq("id", gameId)
        .single();

      if (error) {
        console.error("Error fetching game state:", error);
        return;
      }

      if (data.current_question_start_time) {
        const startTime = new Date(data.current_question_start_time).getTime();
        setQuestionStartTime(startTime);
        if (Date.now() >= startTime + TIME_TIL_CHOICE_REVEAL) {
          setHasShownChoices(true);
        }
      }
    };

    fetchGameState();

    const subscription = supabase
      .channel(`game_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const updatedGame = payload.new as Game;

          if (updatedGame.current_question_start_time) {
            const startTime = new Date(
              updatedGame.current_question_start_time
            ).getTime();
            setQuestionStartTime(startTime);
            if (Date.now() >= startTime + TIME_TIL_CHOICE_REVEAL) {
              setHasShownChoices(true);
            }
          } else {
            setQuestionStartTime(null);
            setHasShownChoices(false);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId]);

  useEffect(() => {
    const fetchAnswers = async () => {
      const { data, error } = await supabase
        .from("answers")
        .select("*, choices(*)")
        .eq("question_id", question.id);

      if (error) {
        console.error("Error fetching answers:", error);
        toast.error("Failed to fetch answers");
      } else if (data) {
        setAnswers(data);
        const userAnswer = data.find((a) => a.participant_id === playerId);
        if (userAnswer) {
          setChosenChoice(userAnswer.choices);
        }
      }
    };

    fetchAnswers();

    const subscription = supabase
      .channel(`answers_${question.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newAnswer = payload.new as Answer;
            setAnswers((prevAnswers) => {
              const existingAnswerIndex = prevAnswers.findIndex(
                (a) => a.participant_id === newAnswer.participant_id
              );
              if (existingAnswerIndex !== -1) {
                const newAnswers = [...prevAnswers];
                newAnswers[existingAnswerIndex] = newAnswer;
                return newAnswers;
              }
              return [...prevAnswers, newAnswer];
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [question.id, playerId]);

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*, profile:profiles(avatar_url)")
        .eq("game_id", gameId);

      if (error) {
        console.error("Error fetching participants:", error);
        toast.error("Failed to fetch participants");
      } else {
        setParticipants(data || []);
      }
    };

    fetchParticipants();

    const subscription = supabase
      .channel(`participants_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("id", payload.new.user_id)
              .single();

            setParticipants((current) => [
              ...current,
              {
                ...payload.new,
                profile: {
                  avatar_url: profileData?.avatar_url || null,
                },
              } as Participant,
            ]);
          } else if (payload.eventType === "DELETE") {
            setParticipants((current) =>
              current.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId]);

  const answer = async (choice: Choice) => {
    if (chosenChoice) {
      return;
    }

    setChosenChoice(choice);

    if (!questionStartTime) {
      toast.error("Question start time is not set");
      return;
    }

    const { error } = await supabase.from("answers").upsert(
      {
        participant_id: playerId,
        question_id: question.id,
        choice_id: choice.id,
      },
      { onConflict: "participant_id,question_id" }
    );

    if (error) {
      toast.error(error.message);
      setChosenChoice(null);
    }
  };

  const getChoiceColor = (index: number, isBackground = false) => {
    switch (index) {
      case 0:
        return isBackground
          ? "bg-red-100 dark:bg-red-900/20"
          : "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40";
      case 1:
        return isBackground
          ? "bg-blue-100 dark:bg-blue-900/20"
          : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/40";
      case 2:
        return isBackground
          ? "bg-yellow-100 dark:bg-yellow-900/20"
          : "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/40";
      default:
        return isBackground
          ? "bg-green-100 dark:bg-green-900/20"
          : "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/40";
    }
  };

  const getChoiceTextColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-red-700 dark:text-red-300";
      case 1:
        return "text-blue-700 dark:text-blue-300";
      case 2:
        return "text-yellow-700 dark:text-yellow-300";
      default:
        return "text-green-700 dark:text-green-300";
    }
  };

  return (
    <div className="flex flex-col flex-grow items-stretch bg-background overflow-auto w-full">
      <Card className="m-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            {question.body}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {question.image && (
            <div className="w-full mx-auto mb-4">
              <Image
                src={
                  getPreloadedImage(`${quiz}/${question.image}`) ||
                  `/api/getImage?path=${quiz}/${question.image}`
                }
                alt={question.body}
                width={400}
                height={400}
                className="w-full h-auto max-h-[30vh] object-contain rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex-grow flex flex-col justify-center items-center min-h-0 p-4">
        {!isAnswerRevealed && chosenChoice && (
          <Card className="w-full max-w-md mb-4">
            <CardContent className="pt-6">
              <p className="text-xl text-center text-muted-foreground">
                Wait for others to answer...
              </p>
            </CardContent>
          </Card>
        )}

        {!hasShownChoices && questionStartTime && (
          <div className="text-center mb-8">
            <CountdownCircleTimer
              key={questionStartTime}
              isPlaying={questionStartTime !== null}
              duration={TIME_TIL_CHOICE_REVEAL / 1000}
              initialRemainingTime={
                questionStartTime
                  ? Math.max(
                      0,
                      (questionStartTime +
                        TIME_TIL_CHOICE_REVEAL -
                        Date.now()) /
                        1000
                    )
                  : TIME_TIL_CHOICE_REVEAL / 1000
              }
              colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
              colorsTime={[7, 5, 2, 0]}
              size={120}
              strokeWidth={8}
              onComplete={() => {
                setHasShownChoices(true);
              }}
            >
              {({ remainingTime }) => (
                <div className="text-2xl font-bold">
                  {Math.ceil(remainingTime)}
                </div>
              )}
            </CountdownCircleTimer>
          </div>
        )}

        {hasShownChoices && !chosenChoice && !isAnswerRevealed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {question.choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => answer(choice)}
                className={cn(
                  "p-6 rounded-lg text-lg font-semibold transition-all",
                  getChoiceColor(index)
                )}
              >
                {choice.body}
              </button>
            ))}
          </div>
        )}

        {isAnswerRevealed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {question.choices.map((choice, index) => (
              <div
                key={choice.id}
                className={cn(
                  "p-6 rounded-lg text-lg font-semibold flex items-center justify-between",
                  getChoiceColor(index),
                  choice.is_correct &&
                    "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                )}
              >
                <span>{choice.body}</span>
                {choice.is_correct ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : chosenChoice?.id === choice.id ? (
                  <CrossIcon className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="m-4 mt-auto">
        <CardContent className="py-3">
          <div className="text-lg font-medium mb-4">
            Question {question.order + 1}/{questionCount}
          </div>
          <ParticipantsList
            participants={participants}
            answers={answers}
            question={question}
            isAnswerRevealed={isAnswerRevealed}
          />
        </CardContent>
      </Card>
    </div>
  );
}
