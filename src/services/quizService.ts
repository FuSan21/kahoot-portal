import { supabase } from "@/types/types";
import { QuizFormData } from "@/types/quiz";

export async function createQuiz(formData: QuizFormData) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to create a quiz");
  }

  // Create quiz set
  if (!formData.coverImage) {
    throw new Error("Cover image is required.");
  }

  const { data: quizSet, error: quizError } = await supabase
    .from("quiz_sets")
    .insert({
      name: formData.name,
      description: formData.description,
      created_by: user.id,
      image: formData.coverImage.name,
      is_public: formData.is_public,
      social_bonus_points: formData.social_bonus_points || 0,
    })
    .select()
    .single();

  if (quizError || !quizSet) {
    throw new Error("Failed to create quiz set");
  }

  // Upload cover image
  if (formData.coverImage) {
    const { error: uploadError } = await supabase.storage
      .from("quiz_images")
      .upload(`${quizSet.id}/${formData.coverImage.name}`, formData.coverImage);

    if (uploadError) {
      throw new Error("Failed to upload cover image");
    }
  }

  // Add questions
  for (let i = 0; i < formData.questions.length; i++) {
    const question = formData.questions[i];
    const imageName = question.image
      ? `${i}.${question.image.name.split(".").pop()}`
      : null;

    // Upload question image if exists
    if (question.image && imageName) {
      const { error: uploadError } = await supabase.storage
        .from("quiz_images")
        .upload(`${quizSet.id}/${imageName}`, question.image);

      if (uploadError) {
        throw new Error(`Failed to upload image for question ${i + 1}`);
      }
    }

    // Add question using RPC function
    const { error: questionError } = await supabase.rpc("add_question", {
      quiz_set_id: quizSet.id,
      body: question.body,
      image: imageName || undefined,
      order: i,
      choices: question.choices.map((choice) => ({
        body: choice.body,
        is_correct: choice.is_correct,
      })),
    });

    if (questionError) {
      throw new Error(`Failed to create question ${i + 1}`);
    }
  }

  return quizSet;
}
