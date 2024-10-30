import React from "react";
import { Answer, Participant, Choice } from "@/types/types";
import CheckIcon from "@/app/components/icons/CheckIcon";
import CrossIcon from "@/app/components/icons/CrossIcon";

interface ParticipantsListProps {
  answers: Answer[];
  participants: Participant[];
  question: {
    choices: Choice[];
  };
  isAnswerRevealed: boolean;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  answers,
  participants,
  question,
  isAnswerRevealed,
}) => {
  return (
    <div className="flex flex-col text-center">
      <div className="text-xl md:text-3xl pb-2 md:pb-4">Participants</div>
      <div className="max-h-36 md:max-h-48 overflow-y-auto">
        {answers.map((answer) => {
          const participant = participants.find(
            (p) => p.id === answer.participant_id
          );
          const choice = question.choices.find(
            (c) => c.id === answer.choice_id
          );
          const isCorrect = choice?.is_correct;
          const choiceIndex = question.choices.findIndex(
            (c) => c.id === answer.choice_id
          );

          const backgroundColor = !isAnswerRevealed
            ? "bg-gray-500"
            : choiceIndex === 0
            ? "bg-red-500"
            : choiceIndex === 1
            ? "bg-blue-500"
            : choiceIndex === 2
            ? "bg-yellow-500"
            : "bg-green-500";

          return (
            <div
              key={answer.id}
              className={`mb-1 md:mb-2 p-1 md:p-2 rounded text-sm md:text-base flex items-center justify-between ${backgroundColor} ${
                isAnswerRevealed && !isCorrect ? "opacity-60" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={participant?.profile?.avatar_url || "/default.png"}
                alt={participant?.nickname}
                className="w-10 h-10 rounded-full mr-3"
              />
              <span>{participant?.nickname}</span>
              {isAnswerRevealed && choice && (
                <span className="ml-2">
                  {isCorrect ? <CheckIcon /> : <CrossIcon />}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantsList;
