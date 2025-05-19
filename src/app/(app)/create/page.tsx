import type { Metadata } from "next";
import { QuizForm } from "./quiz-form";

export const metadata: Metadata = { title: "Create a quiz" };

export default function CreatePage() {
  return (
    <div className="pt-14">
      <div className="mb-10">
        <p className="t-eyebrow mb-3">Create</p>
        <h1 className="t-title">Write a quiz in minutes.</h1>
      </div>
      <QuizForm />
    </div>
  );
}
