// This section (lines 1-50) already has the correct toast import
// and doesn't contain any toast calls that need to be updated.
// No changes needed.

"use client";

import { useState } from "react";
import { QuizFormData, QuizQuestion, QuizChoice } from "@/types/quiz";
import { createQuiz } from "@/services/quizService";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const INITIAL_CHOICE: QuizChoice = {
  body: "",
  is_correct: false,
};

const INITIAL_QUESTION: QuizQuestion = {
  body: "",
  image: null,
  choices: [
    { ...INITIAL_CHOICE },
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
  is_public: true,
  social_bonus_points: 0,
};

export default function QuizForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuizFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate that each question has exactly one correct answer
    const invalidQuestions = formData.questions.filter(
      (question) => !question.choices.some((choice) => choice.is_correct)
    );

    if (invalidQuestions.length > 0) {
      toast.error(
        `Please select a correct answer for question ${
          formData.questions.indexOf(invalidQuestions[0]) + 1
        }`
      );
      return;
    }

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
      is_correct: choice.is_correct,
    }));
    setFormData({ ...formData, questions: newQuestions });
  };

  const deleteQuestion = (index: number) => {
    if (formData.questions.length <= 1) {
      toast.error("Quiz must have at least one question");
      return;
    }
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quiz-name">Quiz Name</Label>
          <Input
            id="quiz-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="min-h-[100px]"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Bonus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="bonus-points">Bonus Points</Label>
            <Input
              id="bonus-points"
              type="number"
              min="0"
              value={formData.social_bonus_points || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  social_bonus_points: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Enter bonus points for sharing"
            />
            <p className="text-sm text-muted-foreground">
              Points awarded when participants share on social media and get
              approved
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_public: checked as boolean })
            }
          />
          <Label htmlFor="is_public" className="text-sm text-muted-foreground">
            Make this quiz public (visible to all users)
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover-image">Cover Image</Label>
          <FileUpload
            value={formData.coverImage}
            onChange={(file: File | null) =>
              setFormData({ ...formData, coverImage: file })
            }
          />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Questions</h2>
        {formData.questions.map((question, qIndex) => (
          <Card key={qIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Question {qIndex + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteQuestion(qIndex)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Input
                  type="text"
                  value={question.body}
                  onChange={(e) =>
                    updateQuestion(qIndex, { body: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Question Image</Label>
                <FileUpload
                  value={question.image}
                  onChange={(file: File | null) =>
                    updateQuestion(qIndex, { image: file })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>Choices</Label>
                <RadioGroup
                  value={question.choices
                    .findIndex((c) => c.is_correct)
                    .toString()}
                  onValueChange={(value) => {
                    const newQuestions = [...formData.questions];
                    newQuestions[qIndex].choices.forEach((c, idx) => {
                      c.is_correct = idx.toString() === value;
                    });
                    setFormData({ ...formData, questions: newQuestions });
                  }}
                >
                  {question.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={choice.body}
                        onChange={(e) =>
                          updateChoice(qIndex, cIndex, e.target.value)
                        }
                        placeholder={`Choice ${cIndex + 1}`}
                        required
                        className="flex-grow"
                      />
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={cIndex.toString()}
                          id={`q${qIndex}-c${cIndex}`}
                        />
                        <Label
                          htmlFor={`q${qIndex}-c${cIndex}`}
                          className="text-sm"
                        >
                          Correct
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex space-x-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setFormData({
              ...formData,
              questions: [...formData.questions, { ...INITIAL_QUESTION }],
            })
          }
        >
          Add Question
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </form>
  );
}
