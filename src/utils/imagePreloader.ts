import { supabase } from "@/types/types";

export async function preloadQuizImages(
  quizId: string,
  onProgress: (progress: number) => void
) {
  try {
    const { data: questions, error } = await supabase
      .from("questions")
      .select("image")
      .eq("quiz_set_id", quizId)
      .not("image", "is", null);

    if (error) throw error;

    let loadedCount = 0;
    const totalImages = questions.length;

    const preloadPromises = questions.map(async (question) => {
      if (question.image) {
        const imagePath = `${quizId}/${question.image}`;
        const response = await fetch(`/api/getImage?path=${imagePath}`);
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);

        const img = new Image();
        img.src = objectURL;

        return new Promise<void>((resolve) => {
          img.onload = () => {
            URL.revokeObjectURL(objectURL);
            loadedCount++;
            onProgress((loadedCount / totalImages) * 100);
            resolve();
          };
        });
      }
    });

    await Promise.all(preloadPromises);
    console.log("All quiz images preloaded");
  } catch (error) {
    console.error("Error preloading quiz images:", error);
  }
}
