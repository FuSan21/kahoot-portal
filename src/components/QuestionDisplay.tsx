import { Question } from "@/types/types";
import { getPreloadedImage } from "@/utils/imagePreloader";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionDisplayProps {
  question: Question;
  quiz: string;
}

export default function QuestionDisplay({
  question,
  quiz,
}: QuestionDisplayProps) {
  return (
    <Card className="m-4 shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl text-center">{question.body}</CardTitle>
      </CardHeader>
      <CardContent>
        {question.image && (
          <div className="w-full mx-auto mb-4">
            <Image
              src={
                getPreloadedImage(`${quiz}/${question.image}`) ||
                `/api/getImage?path=${quiz}/${question.image}`
              }
              alt={question.body}
              width={400}
              height={400}
              className="w-full h-auto max-h-[30vh] object-contain rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
