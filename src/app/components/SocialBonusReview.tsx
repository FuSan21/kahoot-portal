"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/types/types";
import { toast } from "sonner";
import Image from "next/image";

interface SocialBonusSubmission {
  id: string;
  created_at: string;
  participant_id: string;
  screenshot_urls: string[];
  is_approved: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  participant: {
    nickname: string;
  };
}

interface QuizData {
  social_bonus_points: number;
}

interface SocialBonusReviewProps {
  gameId: string;
  quizId: string;
}

export default function SocialBonusReview({
  gameId,
  quizId,
}: SocialBonusReviewProps) {
  const [submissions, setSubmissions] = useState<SocialBonusSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenshotUrls, setScreenshotUrls] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from("social_bonus_submissions")
        .select(
          `
          *,
          participant:participants(nickname)
        `
        )
        .eq("participant.game_id", gameId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        toast.error("Failed to load submissions");
        return;
      }

      setSubmissions(
        data?.map((submission) => ({
          ...submission,
          is_approved: submission.is_approved || false,
        })) || []
      );

      // Create proxy URLs for all screenshots
      const urls: Record<string, string[]> = {};
      for (const submission of data || []) {
        urls[submission.id] = submission.screenshot_urls.map(
          (path) =>
            `/api/getImage?path=${encodeURIComponent(
              path
            )}&bucket=social_screenshots`
        );
      }
      setScreenshotUrls(urls);
      setLoading(false);
    };

    fetchSubmissions();
  }, [gameId]);

  const handleApprove = async (submissionId: string, participantId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("social_bonus_submissions")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", submissionId);

      if (updateError) throw updateError;

      // Get the bonus points value
      const { data, error: quizError } = await supabase
        .from("quiz_sets")
        .select("social_bonus_points")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;
      if (!data) throw new Error("Quiz not found");

      const quizData = data as unknown as QuizData;
      if (typeof quizData.social_bonus_points !== "number") {
        throw new Error("Bonus points not set for this quiz");
      }

      // Add bonus points to the participant's score
      const { error: answerError } = await supabase
        .from("answers")
        .update({
          score: quizData.social_bonus_points,
        })
        .eq("participant_id", participantId);

      if (answerError) throw answerError;

      toast.success("Submission approved and bonus points awarded!");

      // Update local state
      setSubmissions(
        submissions.map((sub) =>
          sub.id === submissionId ? { ...sub, is_approved: true } : sub
        )
      );
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve submission");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No social media bonus submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Social Media Submissions</h2>
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {submission.participant.nickname}
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted:{" "}
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                </div>
                {!submission.is_approved && (
                  <button
                    onClick={() =>
                      handleApprove(submission.id, submission.participant_id)
                    }
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                )}
                {submission.is_approved && (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded">
                    Approved
                  </span>
                )}
              </div>
              {screenshotUrls[submission.id] && (
                <div className="grid grid-cols-2 gap-4">
                  {screenshotUrls[submission.id].map((url, index) => (
                    <div key={index} className="relative aspect-video">
                      <Image
                        src={url}
                        alt={`Social media post screenshot ${index + 1}`}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
