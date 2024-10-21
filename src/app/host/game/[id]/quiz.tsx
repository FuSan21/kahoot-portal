import { TIME_TIL_CHOICE_REVEAL, QUESTION_ANSWER_TIME } from "@/constants";
import { Answer, Participant, Question, supabase, Game } from "@/types/types";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import Image from "next/image";
import { toast } from "sonner";

export default function Quiz({
  question: question,
  quiz: quiz,
  questionCount: questionCount,
  gameId,
  participants,
}: {
  question: Question;
  quiz: string;
  questionCount: number;
  gameId: string;
  participants: Participant[];
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const [hasShownChoices, setHasShownChoices] = useState(false);

  const [answers, setAnswers] = useState<Answer[]>([]);

  const answerStateRef = useRef<Answer[]>();

  answerStateRef.current = answers;

  const [questionStartTime, setQuestionStartTime] = useState<string | null>(
    null
  );

  useEffect(() => {
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
            console.log(
              "Host: Question start time updated:",
              updatedGame.current_question_start_time
            );
            setQuestionStartTime(updatedGame.current_question_start_time);
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
      console.log(
        "Setting current_question_start_time to null for next question"
      );
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
    // If you need to return something for the OnComplete type, you can do so here
    // For example, to stop the timer:
    return { shouldRepeat: false };
  }, [onTimeUp]);

  const participantsLengthRef = useRef(participants.length);

  useEffect(() => {
    participantsLengthRef.current = participants.length;
  }, [participants.length]);

  useEffect(() => {
    setIsAnswerRevealed(false);
    setHasShownChoices(false);
    setAnswers([]);

    const fetchStartTime = async () => {
      if (!questionStartTime) {
        const { data, error } = await supabase
          .from("games")
          .select("current_question_start_time")
          .eq("id", gameId)
          .single();

        if (data && data.current_question_start_time) {
          setQuestionStartTime(data.current_question_start_time);
        }
      }
    };

    fetchStartTime();

    const channel = supabase
      .channel("answers")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          setAnswers((currentAnswers) => {
            return [...currentAnswers, payload.new as Answer];
          });

          if (
            (answerStateRef.current?.length ?? 0) + 1 ===
            participantsLengthRef.current
          ) {
            onTimeUp();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [question.id, onTimeUp, gameId, questionStartTime]);

  useEffect(() => {
    if (!questionStartTime) return;

    const checkAndSetChoicesVisibility = () => {
      const startTimeMs = new Date(questionStartTime).getTime();
      const revealTime = startTimeMs + TIME_TIL_CHOICE_REVEAL;
      const now = Date.now();

      if (now >= revealTime) {
        setHasShownChoices(true);
      } else {
        const timeoutId = setTimeout(() => {
          setHasShownChoices(true);
        }, revealTime - now);

        return () => clearTimeout(timeoutId);
      }
    };

    checkAndSetChoicesVisibility();
  }, [questionStartTime]);

  const initialRemainingTime = useMemo(() => {
    if (!questionStartTime || !hasShownChoices)
      return QUESTION_ANSWER_TIME / 1000;

    const startTime = new Date(questionStartTime).getTime();
    const choicesRevealTime = startTime + TIME_TIL_CHOICE_REVEAL;
    const now = Date.now();
    const elapsedTime = now - choicesRevealTime;
    const remainingTime =
      Math.max(0, QUESTION_ANSWER_TIME - elapsedTime) / 1000;
    return remainingTime;
  }, [questionStartTime, hasShownChoices]);

  return (
    <div className="flex flex-col flex-grow items-stretch bg-slate-900 overflow-auto">
      <div className="flex-grow flex flex-col min-h-0">
        <div className="absolute right-4 top-28 z-10">
          {isAnswerRevealed && (
            <button
              className="p-2 bg-white text-black rounded hover:bg-gray-200"
              onClick={getNextQuestion}
            >
              Next
            </button>
          )}
        </div>

        <div className="text-center py-4 flex-shrink-0">
          <h2 className="pb-4 text-3xl bg-white font-bold mx-auto my-12 p-4 rounded inline-block max-w-[80%]">
            {question.body}
          </h2>
          {question.image && (
            <div className="w-full max-w-[400px] mx-auto">
              <Image
                src={`/api/getImage?path=${quiz}/${question.image}`}
                alt={question.body}
                width={400}
                height={400}
                className="w-full h-auto max-h-[40vh] object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex-grow flex flex-col justify-center items-center min-h-0 text-white px-8">
          {hasShownChoices && !isAnswerRevealed && questionStartTime && (
            <div className="flex justify-between items-center w-full max-w-4xl">
              <div className="text-5xl">
                <CountdownCircleTimer
                  key={`${questionStartTime}-${hasShownChoices}`}
                  onComplete={handleTimeUp}
                  isPlaying={hasShownChoices}
                  duration={QUESTION_ANSWER_TIME / 1000}
                  initialRemainingTime={initialRemainingTime}
                  colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
                  colorsTime={[15, 10, 5, 0]}
                >
                  {({ remainingTime }) => Math.ceil(remainingTime)}
                </CountdownCircleTimer>
              </div>
              <div className="text-center">
                <div className="text-6xl pb-4">{answers.length}</div>
                <div className="text-3xl">Answers</div>
              </div>
            </div>
          )}
          {isAnswerRevealed && (
            <div className="flex justify-center w-full max-w-4xl">
              {question.choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className="mx-2 h-48 w-24 flex flex-col items-stretch justify-end"
                >
                  <div className="flex-grow relative">
                    <div
                      style={{
                        height: `${
                          (answers.filter(
                            (answer) => answer.choice_id === choice.id
                          ).length *
                            100) /
                          (answers.length || 1)
                        }%`,
                      }}
                      className={`absolute bottom-0 left-0 right-0 mb-1 rounded-t ${
                        index === 0
                          ? "bg-red-500"
                          : index === 1
                          ? "bg-blue-500"
                          : index === 2
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                  </div>
                  <div
                    className={`mt-1 text-white text-lg text-center py-2 rounded-b ${
                      index === 0
                        ? "bg-red-500"
                        : index === 1
                        ? "bg-blue-500"
                        : index === 2
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  >
                    {
                      answers.filter((answer) => answer.choice_id === choice.id)
                        .length
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasShownChoices && (
          <div className="flex justify-between flex-wrap p-4 max-w-4xl mx-auto w-full">
            {question.choices.map((choice, index) => (
              <div key={choice.id} className="w-1/2 p-1 flex">
                <div
                  className={`px-4 py-6 w-full text-2xl rounded font-bold text-white flex items-center
                  ${
                    index === 0
                      ? "bg-red-500"
                      : index === 1
                      ? "bg-blue-500"
                      : index === 2
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }
                  ${isAnswerRevealed && !choice.is_correct ? "opacity-60" : ""}
                 `}
                >
                  <div className="flex-grow">{choice.body}</div>
                  {isAnswerRevealed && (
                    <div className="flex-shrink-0 ml-2">
                      {choice.is_correct ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex text-white py-2 px-4 items-center bg-black flex-shrink-0">
          <div className="text-2xl">
            {question.order + 1}/{questionCount}
          </div>
        </div>
      </div>
    </div>
  );
}
