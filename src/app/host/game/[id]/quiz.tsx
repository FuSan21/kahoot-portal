import { TIME_TIL_CHOICE_REVEAL, QUESTION_ANSWER_TIME } from "@/constants";
import { Answer, Participant, Question, supabase, Game } from "@/types/types";
import { getPreloadedImage } from "@/utils/imagePreloader";
import CheckIcon from "@/app/components/icons/CheckIcon";
import CrossIcon from "@/app/components/icons/CrossIcon";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import Image from "next/image";
import { toast } from "sonner";
import ParticipantsList from "@/components/ParticipantsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Quiz({
  question: question,
  quiz: quiz,
  questionCount: questionCount,
  gameId,
  participants,
  isAuthorized,
}: {
  question: Question;
  quiz: string;
  questionCount: number;
  gameId: string;
  participants: Participant[];
  isAuthorized: boolean;
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [hasShownChoices, setHasShownChoices] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const answerStateRef = useRef<Answer[]>(undefined);
  answerStateRef.current = answers;
  const [questionStartTime, setQuestionStartTime] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchStartTime = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("current_question_start_time,is_answer_revealed")
        .eq("id", gameId)
        .single();

      if (error) {
        console.error("Error fetching game state:", error);
        return;
      }

      if (data.current_question_start_time) {
        setQuestionStartTime(data.current_question_start_time);
        const startTime = new Date(data.current_question_start_time).getTime();
        if (Date.now() >= startTime + TIME_TIL_CHOICE_REVEAL) {
          setHasShownChoices(true);
        }
      }
      if (data.is_answer_revealed) {
        setIsAnswerRevealed(true);
      }
    };

    fetchStartTime();

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
            setQuestionStartTime(updatedGame.current_question_start_time);
            const startTime = new Date(
              updatedGame.current_question_start_time
            ).getTime();
            if (Date.now() >= startTime + TIME_TIL_CHOICE_REVEAL) {
              setHasShownChoices(true);
            }
          } else {
            setQuestionStartTime(null);
            setHasShownChoices(false);
          }
          if (updatedGame.is_answer_revealed) {
            setIsAnswerRevealed(true);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId]);

  const getNextQuestion = async () => {
    var updateData;
    if (questionCount == question.order + 1) {
      updateData = { phase: "result" };
    } else {
      updateData = {
        current_question_sequence: question.order + 1,
        is_answer_revealed: false,
        current_question_start_time: null,
      };
    }

    const { data, error } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", gameId);
    if (error) {
      return toast.error(error.message);
    }
  };

  const onTimeUp = useCallback(async () => {
    setIsAnswerRevealed(true);
    await supabase
      .from("games")
      .update({
        is_answer_revealed: true,
      })
      .eq("id", gameId);
  }, [gameId]);

  const handleTimeUp = useCallback(() => {
    onTimeUp();
    return { shouldRepeat: false };
  }, [onTimeUp]);

  useEffect(() => {
    setIsAnswerRevealed(false);
    setHasShownChoices(false);
    setAnswers([]);
  }, [question.id]);

  useEffect(() => {
    const fetchAnswers = async () => {
      const { data: answerData, error: answerError } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", question.id);

      if (answerError) {
        console.error("Error fetching answers:", answerError);
        toast.error("Failed to fetch answers");
        return;
      }

      const validAnswers =
        answerData?.filter((answer) =>
          participants.some((p) => p.id === answer.participant_id)
        ) || [];

      setAnswers(validAnswers);

      if (validAnswers.length === participants.length && !isAnswerRevealed) {
        onTimeUp();
      }
    };

    fetchAnswers();

    const fetchStartTime = async () => {
      if (!questionStartTime) {
        const { data, error } = await supabase
          .from("games")
          .select("current_question_start_time,is_answer_revealed")
          .eq("id", gameId)
          .single();

        if (data && data.current_question_start_time) {
          setQuestionStartTime(data.current_question_start_time);
        }
        if (data && data.is_answer_revealed) {
          setIsAnswerRevealed(true);
        }
      }
    };

    fetchStartTime();

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
            if (participants.some((p) => p.id === newAnswer.participant_id)) {
              setAnswers((prevAnswers) => {
                const newAnswers = [...prevAnswers];
                const existingAnswerIndex = newAnswers.findIndex(
                  (a) => a.participant_id === newAnswer.participant_id
                );
                if (existingAnswerIndex !== -1) {
                  newAnswers[existingAnswerIndex] = newAnswer;
                } else {
                  newAnswers.push(newAnswer);
                }

                if (
                  newAnswers.length === participants.length &&
                  !isAnswerRevealed
                ) {
                  onTimeUp();
                }

                return newAnswers;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [
    question.id,
    participants,
    questionStartTime,
    gameId,
    isAnswerRevealed,
    onTimeUp,
  ]);

  if (!isAuthorized) {
    return null;
  }

  const startQuestion = async () => {
    const { error } = await supabase
      .from("games")
      .update({
        current_question_start_time: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (error) {
      toast.error(error.message);
    }
  };

  const answerCount = answers.length;
  const participantCount = participants.length;
  const answerPercentage = (answerCount / participantCount) * 100;

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
        {!questionStartTime && (
          <Button size="lg" className="mb-8" onClick={startQuestion}>
            Start Question
          </Button>
        )}

        {questionStartTime && !hasShownChoices && (
          <div className="text-center mb-8">
            <CountdownCircleTimer
              key={questionStartTime}
              isPlaying={questionStartTime !== null}
              duration={TIME_TIL_CHOICE_REVEAL / 1000}
              initialRemainingTime={
                questionStartTime
                  ? Math.max(
                      0,
                      (new Date(questionStartTime).getTime() +
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

        {questionStartTime && hasShownChoices && !isAnswerRevealed && (
          <div className="text-center mb-8">
            <CountdownCircleTimer
              key={questionStartTime}
              isPlaying
              duration={QUESTION_ANSWER_TIME / 1000}
              initialRemainingTime={
                questionStartTime
                  ? Math.max(
                      0,
                      (new Date(questionStartTime).getTime() +
                        TIME_TIL_CHOICE_REVEAL +
                        QUESTION_ANSWER_TIME -
                        Date.now()) /
                        1000
                    )
                  : QUESTION_ANSWER_TIME / 1000
              }
              colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
              colorsTime={[7, 5, 2, 0]}
              size={120}
              strokeWidth={8}
              onComplete={handleTimeUp}
            >
              {({ remainingTime }) => (
                <div className="text-2xl font-bold">
                  {Math.ceil(remainingTime)}
                </div>
              )}
            </CountdownCircleTimer>
          </div>
        )}

        <Card className="w-full max-w-md mb-8">
          <CardContent className="pt-6">
            <Progress value={answerPercentage} className="mb-2" />
            <p className="text-center text-sm text-muted-foreground">
              Answers received: {answerCount}/{participantCount}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          {question.choices.map((choice, index) => {
            const choiceAnswers = answers.filter(
              (answer) => answer.choice_id === choice.id
            );
            const percentage =
              participantCount > 0
                ? (choiceAnswers.length / participantCount) * 100
                : 0;

            return (
              <div
                key={choice.id}
                className={cn(
                  "p-6 rounded-lg text-lg font-semibold",
                  getChoiceColor(index),
                  isAnswerRevealed &&
                    choice.is_correct &&
                    "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                )}
              >
                <div className="flex justify-between items-center">
                  <span>{choice.body}</span>
                  {isAnswerRevealed && choice.is_correct && (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {isAnswerRevealed && (
                  <div className="flex items-end gap-2 mt-2">
                    <div className="flex-grow">
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "absolute left-0 top-0 h-full transition-all duration-500",
                            index === 0
                              ? "bg-red-500"
                              : index === 1
                              ? "bg-blue-500"
                              : index === 2
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {choiceAnswers.length} answers ({Math.round(percentage)}
                        %)
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-4 transition-all duration-500",
                        index === 0
                          ? "bg-red-500"
                          : index === 1
                          ? "bg-blue-500"
                          : index === 2
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      )}
                      style={{ height: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAnswerRevealed && (
          <Button size="lg" className="mt-8" onClick={getNextQuestion}>
            Next Question
          </Button>
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
