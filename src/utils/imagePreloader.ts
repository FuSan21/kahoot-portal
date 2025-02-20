import { supabase } from "@/types/types";

const imageCache: { [key: string]: string } = {};

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

    if (!questions || questions.length === 0) {
      onProgress(100);
      return;
    }

    let loadedCount = 0;
    const totalImages = questions.length;

    const preloadPromises = questions.map(async (question) => {
      if (!question.image) {
        loadedCount++;
        onProgress((loadedCount / totalImages) * 100);
        return;
      }

      const imagePath = `${quizId}/${question.image}`;
      const response = await fetch(`/api/getImage?path=${imagePath}`);
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      imageCache[imagePath] = objectURL;

      const img = new Image();
      img.src = objectURL;

      return new Promise<void>((resolve) => {
        img.onload = () => {
          loadedCount++;
          onProgress((loadedCount / totalImages) * 100);
          resolve();
        };
      });
    });

    await Promise.all(preloadPromises);
  } catch (error) {
    console.error("Error preloading quiz images:", error);
    onProgress(100);
  }
}

export function getPreloadedImage(imagePath: string): string | undefined {
  return imageCache[imagePath];
}
