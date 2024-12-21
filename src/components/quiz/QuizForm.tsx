"use client";

import { useState } from "react";
import { QuizFormData, QuizQuestion, QuizChoice } from "@/types/quiz";
import { createQuiz } from "@/services/quizService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const INITIAL_CHOICE: QuizChoice = {
  body: "",
  is_correct: false,
};

const INITIAL_QUESTION: QuizQuestion = {
  body: "",
  image: null,
  choices: [
    { ...INITIAL_CHOICE, is_correct: true },
    { ...INITIAL_CHOICE },
    { ...INITIAL_CHOICE },
    { ...INITIAL_CHOICE },
  ],
};

const INITIAL_FORM_DATA: QuizFormData = {
  name: "",
  description: "",
  coverImage: null,
  questions: [INITIAL_QUESTION],
};

export default function QuizForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuizFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createQuiz(formData);
      toast.success("Quiz created successfully!");
      router.push("/host/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create quiz"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateChoice = (
    questionIndex: number,
    choiceIndex: number,
    body: string
  ) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].choices = newQuestions[
      questionIndex
    ].choices.map((choice, idx) => ({
      ...choice,
      body: idx === choiceIndex ? body : choice.body,
      is_correct: idx === choiceIndex,
    }));
    setFormData({ ...formData, questions: newQuestions });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block mb-2">Quiz Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-2">Cover Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFormData({
              ...formData,
              coverImage: e.target.files?.[0] || null,
            })
          }
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Questions</h2>
        {formData.questions.map((question, qIndex) => (
          <div key={qIndex} className="p-4 border rounded space-y-4">
            <div>
              <label className="block mb-2">Question {qIndex + 1}</label>
              <input
                type="text"
                value={question.body}
                onChange={(e) =>
                  updateQuestion(qIndex, { body: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-2">Question Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  updateQuestion(qIndex, { image: e.target.files?.[0] || null })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="space-y-4">
              {question.choices.map((choice, cIndex) => (
                <div key={cIndex} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={choice.body}
                    onChange={(e) =>
                      updateChoice(qIndex, cIndex, e.target.value)
                    }
                    className="flex-grow p-2 border rounded"
                    placeholder={`Choice ${cIndex + 1}`}
                    required
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={choice.is_correct}
                      onChange={() => updateChoice(qIndex, cIndex, choice.body)}
                      required
                    />
                    <span>Correct</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-x-2">
        <button
          type="button"
          onClick={() =>
            setFormData({
              ...formData,
              questions: [...formData.questions, { ...INITIAL_QUESTION }],
            })
          }
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Question
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Quiz
        </button>
      </div>
    </form>
  );
}
