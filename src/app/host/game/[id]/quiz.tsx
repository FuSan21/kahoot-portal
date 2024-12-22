import { TIME_TIL_CHOICE_REVEAL, QUESTION_ANSWER_TIME } from "@/constants";
import { Answer, Participant, Question, supabase, Game } from "@/types/types";
import { getPreloadedImage } from "@/utils/imagePreloader";
import CheckIcon from "@/app/components/icons/CheckIcon";
import CrossIcon from "@/app/components/icons/CrossIcon";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import Image from "next/image";
import { toast } from "sonner";
import ParticipantsList from "@/app/components/ParticipantsList";

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
  }, [question.id]);

  useEffect(() => {
    const fetchAnswers = async () => {
      const participantIds = participants.map((p) => p.id);
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", question.id)
        .in("participant_id", participantIds);

      if (error) {
        console.error("Error fetching answers:", error);
        toast.error("Failed to fetch answers");
      } else {
        setAnswers(data || []);
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
          const newAnswer = payload.new as Answer;
          setAnswers((currentAnswers) => {
            const updatedAnswers = [...currentAnswers, newAnswer];
            return updatedAnswers;
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
  }, [
    question.id,
    onTimeUp,
    gameId,
    questionStartTime,
    question.choices,
    participants,
  ]);

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

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col flex-grow items-stretch bg-slate-900 overflow-auto w-full">
      <div className="relative flex justify-end p-4 z-10">
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
          <div className="w-full mx-auto">
            <Image
              src={
                getPreloadedImage(`${quiz}/${question.image}`) ||
                `/api/getImage?path=${quiz}/${question.image}`
              }
              alt={question.body}
              width={400}
              height={400}
              className="w-full h-auto max-h-[30vh] object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow flex-wrap md:flex-row justify-between p-4 max-w-4xl mx-auto w-full text-white">
        {hasShownChoices && !isAnswerRevealed && questionStartTime && (
          <div className="flex justify-center md:justify-start items-center w-full mb-4 md:mb-0">
            <div className="text-5xl">
              <CountdownCircleTimer
                key={`${questionStartTime}-${hasShownChoices}`}
                onComplete={handleTimeUp}
                isPlaying={hasShownChoices}
                duration={QUESTION_ANSWER_TIME / 1000}
                initialRemainingTime={initialRemainingTime}
                colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
                colorsTime={[15, 10, 5, 0]}
                size={80}
              >
                {({ remainingTime }) => Math.ceil(remainingTime)}
              </CountdownCircleTimer>
            </div>
          </div>
        )}
        {isAnswerRevealed && (
          <div className="flex flex-grow flex-shrink justify-center w-full mb-4 md:mb-0 basis-52">
            {question.choices.map((choice, index) => (
              <div
                key={choice.id}
                className="mx-1 h-36 md:h-48 w-16 md:w-24 flex flex-col flex-shrink items-stretch justify-end"
              >
                <div
                  className={`flex-grow relative ${
                    isAnswerRevealed && !choice.is_correct ? "opacity-60" : ""
                  }`}
                >
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
                  className={`mt-1 text-white text-sm md:text-lg text-center py-1 md:py-2 rounded-b ${
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
        {hasShownChoices && (
          <ParticipantsList
            answers={answers}
            participants={participants}
            question={{ choices: question.choices }}
            isAnswerRevealed={isAnswerRevealed}
          />
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
                  <div className="flex-shrink-0">
                    {choice.is_correct ? <CheckIcon /> : <CrossIcon />}
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
  );
}
