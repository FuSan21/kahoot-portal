import Image from "next/image";
import { Lock } from "lucide-react";
import { HostButton } from "@/components/quiz/host-button";
import { ANSWER_TONES, quizImageUrl } from "@/lib/game";
import { cn } from "@/lib/utils";

export type QuizCardData = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  is_public: boolean;
  questionCount: number;
  ownerName?: string | null;
  mine?: boolean;
};

export function QuizCard({ quiz, index = 0, priority }: { quiz: QuizCardData; index?: number; priority?: boolean }) {
  const cover = quizImageUrl(quiz.id, quiz.image);
  const tone = ANSWER_TONES[index % ANSWER_TONES.length];

  return (
    <article className="card group flex flex-col overflow-hidden" data-link>
      <div className={cn("zoom relative aspect-[16/10] bg-surface-2", `tile-${tone}`)}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[var(--tile)] text-[var(--tile-ink)]">
            <span className="text-6xl font-medium tracking-tighter">{quiz.name.slice(0, 1)}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white backdrop-blur">
          {quiz.questionCount} questions
        </span>
        {!quiz.is_public && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
            <Lock className="size-3" /> Private
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-xl leading-tight">{quiz.name}</h3>
        {quiz.description && <p className="line-clamp-2 text-[15px] text-muted-foreground">{quiz.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="truncate text-sm text-muted-foreground">
            {quiz.mine ? "Your quiz" : quiz.ownerName ? `By ${quiz.ownerName}` : null}
          </span>
          <HostButton quizSetId={quiz.id} />
        </div>
      </div>
    </article>
  );
}
