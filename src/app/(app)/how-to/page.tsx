import type { Metadata } from "next";
import { Gauge, MonitorPlay, Share2, Smartphone, Trophy, Wand2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "How it works" };

const HOST_STEPS = [
  { icon: Wand2, title: "Create or pick a quiz", body: "Write questions with four choices and mark the right one, or host a quiz from the library." },
  { icon: MonitorPlay, title: "Open a lobby on a big screen", body: "Press Host game. A six-digit code and a QR code appear for the room." },
  { icon: Trophy, title: "Run the questions", body: "Each question opens two seconds after it appears. The answer is revealed when time runs out or everyone has answered." },
];

const PLAYER_STEPS = [
  { icon: Smartphone, title: "Join from your phone", body: "Enter the code on the home page or scan the QR code. You join with your Google name." },
  { icon: Gauge, title: "Answer fast", body: "A correct answer scores between 500 and 1,000 points. The faster you answer, the more you get. Wrong answers score zero." },
  { icon: Share2, title: "Claim the share bonus", body: "Some quizzes give bonus points for sharing. Upload a screenshot from your results screen and the host approves it." },
];

function Steps({ steps, start }: { steps: typeof HOST_STEPS; start: number }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl bg-surface-2">
              <s.icon className="size-5" />
            </span>
            <span className="font-mono text-sm text-muted-foreground tabular">0{start + i}</span>
          </div>
          <h3 className="text-xl">{s.title}</h3>
          <p className="text-[15px] text-muted-foreground">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export default function HowToPage() {
  return (
    <div className="pt-14">
      <div className="mb-14 max-w-3xl">
        <p className="t-eyebrow mb-3">How it works</p>
        <h1 className="t-title mb-5">One host screen, a phone for every player.</h1>
        <p className="text-lg text-muted-foreground">Scores add up across every game you play in a month, Dhaka time.</p>
      </div>
      <section className="mb-14" aria-labelledby="host-steps">
        <h2 id="host-steps" className="mb-5 text-2xl">
          For hosts
        </h2>
        <Steps steps={HOST_STEPS} start={1} />
      </section>
      <section className="mb-14" aria-labelledby="player-steps">
        <h2 id="player-steps" className="mb-5 text-2xl">
          For players
        </h2>
        <Steps steps={PLAYER_STEPS} start={4} />
      </section>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/library">Host a game</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/create">Create a quiz</Link>
        </Button>
      </div>
    </div>
  );
}
