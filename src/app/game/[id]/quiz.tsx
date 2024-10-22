import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from "@/constants";
import { Choice, Question, supabase, Game } from "@/types/types";
import { getPreloadedImage } from "@/utils/imagePreloader";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ColorFormat,
  CountdownCircleTimer,
} from "react-countdown-circle-timer";

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

  const [currentScore, setCurrentScore] = useState<number | null>(null);

  useEffect(() => {
    setChosenChoice(null);
    setHasShownChoices(false);
  }, [question.id]);

  useEffect(() => {
    // Fetch current game state on mount
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
            console.log(
              "Client: Question start time updated:",
              updatedGame.current_question_start_time
            );
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

  const answer = async (choice: Choice) => {
    setChosenChoice(choice);

    if (!questionStartTime) {
      toast.error("Question start time is not set");
      return;
    }

    const answerTime = Date.now() - questionStartTime;
    let score = 0;

    if (choice.is_correct) {
      if (answerTime <= 3000) score = 3;
      else if (answerTime <= 6000) score = 2;
      else score = 1;
    }

    setCurrentScore(score);

    const { error } = await supabase.from("answers").insert({
      participant_id: playerId,
      question_id: question.id,
      choice_id: choice.id,
      score: score,
    });

    if (error) {
      setChosenChoice(null);
      setCurrentScore(null);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col flex-grow items-stretch bg-slate-900 overflow-auto">
      <div className="text-center py-4 flex-shrink-0">
        <h2 className="pb-4 text-2xl bg-white font-bold mx-4 my-12 p-4 rounded inline-block md:text-3xl md:px-24">
          {question.body}
        </h2>
        {question.image && (
          <div className="w-full max-w-[400px] mx-auto">
            <Image
              src={
                getPreloadedImage(`${quiz}/${question.image}`) ||
                `/api/getImage?path=${quiz}/${question.image}`
              }
              alt={question.body}
              width={400}
              height={400}
              className="w-full h-auto max-h-[40vh] object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col justify-center items-center min-h-0">
        {!isAnswerRevealed && chosenChoice && (
          <div className="text-white text-2xl text-center p-4">
            Wait for others to answer...
          </div>
        )}

        {!hasShownChoices && !isAnswerRevealed && (
          <div className="text-transparent">
            <CountdownCircleTimer
              key={questionStartTime}
              onComplete={() => {
                setHasShownChoices(true);
              }}
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
              colors={["#fff", "#fff", "#fff", "#fff"]}
              trailColor={"transparent" as ColorFormat}
              colorsTime={[7, 5, 2, 0]}
            >
              {({ remainingTime }) => remainingTime}
            </CountdownCircleTimer>
          </div>
        )}

        {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
          <div className="w-full max-w-4xl px-4">
            <div className="flex justify-between flex-wrap">
              {question.choices.map((choice, index) => (
                <div key={choice.id} className="w-1/2 p-1 flex">
                  <button
                    onClick={() => answer(choice)}
                    disabled={chosenChoice !== null || isAnswerRevealed}
                    className={`px-4 py-6 w-full text-xl rounded text-white flex justify-between items-center md:text-2xl md:font-bold
                    ${
                      index === 0
                        ? "bg-red-500"
                        : index === 1
                        ? "bg-blue-500"
                        : index === 2
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }
                    ${
                      isAnswerRevealed && !choice.is_correct ? "opacity-60" : ""
                    }
                   `}
                  >
                    <div className="flex-grow">{choice.body}</div>
                    {isAnswerRevealed && (
                      <div className="flex-shrink-0 ml-2">
                        {choice.is_correct && (
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
                        )}
                        {!choice.is_correct && (
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
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAnswerRevealed && (
          <div className="text-center">
            <h2 className="text-white text-2xl text-center pb-2">
              {chosenChoice?.is_correct ? "Correct" : "Incorrect"}
            </h2>
            <div
              className={`text-white rounded-full p-4 inline-block ${
                chosenChoice?.is_correct ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {chosenChoice?.is_correct && (
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
              )}
              {!chosenChoice?.is_correct && (
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
          </div>
        )}
      </div>

      <div className="flex text-white py-2 px-4 items-center bg-black flex-shrink-0">
        <div className="text-2xl">
          {question.order + 1}/{questionCount}
        </div>
      </div>
    </div>
  );
}
