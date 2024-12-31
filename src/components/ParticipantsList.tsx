import { useRef, useState } from "react";
import { Answer, Participant, Question } from "@/types/types";
import { cn } from "@/lib/utils";
import CheckIcon from "@/app/components/icons/CheckIcon";
import CrossIcon from "@/app/components/icons/CrossIcon";

interface ParticipantsListProps {
  participants: Participant[];
  answers: Answer[];
  question: Question;
  isAnswerRevealed: boolean;
}

export default function ParticipantsList({
  participants,
  answers,
  question,
  isAnswerRevealed,
}: ParticipantsListProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const participantsRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!participantsRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - participantsRef.current.offsetLeft);
    setScrollLeft(participantsRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !participantsRef.current) return;
    e.preventDefault();
    const x = e.pageX - participantsRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    participantsRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!participantsRef.current) return;
    if (e.deltaY !== 0) {
      e.preventDefault();
      participantsRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={participantsRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="overflow-x-auto cursor-grab active:cursor-grabbing pb-2 no-scrollbar"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="inline-flex gap-2 min-w-full">
        {participants
          .filter((participant) =>
            answers.some((a) => a.participant_id === participant.id)
          )
          .sort((a, b) => {
            const answerA = answers.find((ans) => ans.participant_id === a.id);
            const answerB = answers.find((ans) => ans.participant_id === b.id);
            return answerA && answerB
              ? new Date(answerA.created_at).getTime() -
                  new Date(answerB.created_at).getTime()
              : 0;
          })
          .map((participant) => {
            const answer = answers.find(
              (a) => a.participant_id === participant.id
            );
            const choice = answer
              ? question.choices.find((c) => c.id === answer.choice_id)
              : null;
            const choiceIndex = choice
              ? question.choices.findIndex((c) => c.id === choice.id)
              : -1;

            return (
              <div
                key={participant.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 shrink-0",
                  "w-[200px]",
                  isAnswerRevealed && choice
                    ? choiceIndex === 0
                      ? "bg-red-500/10"
                      : choiceIndex === 1
                      ? "bg-blue-500/10"
                      : choiceIndex === 2
                      ? "bg-yellow-500/10"
                      : "bg-green-500/10"
                    : answer
                    ? "bg-muted"
                    : "bg-background"
                )}
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-muted">
                  {participant.profile?.avatar_url ? (
                    <img
                      src={participant.profile.avatar_url}
                      alt={participant.nickname}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                      {participant.nickname[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="truncate text-sm font-medium">
                    {participant.nickname}
                  </div>
                  {isAnswerRevealed && choice && (
                    <div className="text-xs truncate">{choice.body}</div>
                  )}
                </div>
                {answer && (
                  <div className="flex-shrink-0">
                    {isAnswerRevealed ? (
                      choice?.is_correct ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <CrossIcon className="h-4 w-4 text-red-500" />
                      )
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
