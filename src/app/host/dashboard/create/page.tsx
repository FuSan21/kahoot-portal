"use client";

import QuizForm from "@/app/components/QuizForm";

export default function CreateQuizPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
      <QuizForm />
    </div>
  );
}
