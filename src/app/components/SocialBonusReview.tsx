"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Share2, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialBonusReviewProps {
  gameId: string;
  bonusPoints: number;
}

type SocialBonusSubmission = {
  id: string;
  participant_id: string;
  screenshot_urls: string[];
  is_approved: boolean | null;
  created_at: string;
  updated_at: string;
  participant_nickname: string;
};

export default function SocialBonusReview({
  gameId,
  bonusPoints,
}: SocialBonusReviewProps) {
  const [submissions, setSubmissions] = useState<SocialBonusSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase.rpc(
        "get_game_social_bonus_submissions",
        { _game_id: gameId }
      );

      if (error) {
        console.error("Error fetching submissions:", error);
        toast.error("Failed to load submissions");
        return;
      }

      setSubmissions(data || []);
      setLoading(false);
    };

    fetchSubmissions();

    // Subscribe to changes
    const channel = supabase
      .channel("social_bonus_submissions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "social_bonus_submissions",
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [gameId]);

  const handleApprove = async (submissionId: string) => {
    setReviewingId(submissionId);
    try {
      const { error } = await supabase
        .from("social_bonus_submissions")
        .update({ is_approved: true })
        .eq("id", submissionId);

      if (error) throw error;

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId ? { ...sub, is_approved: true } : sub
        )
      );
      toast.success("Submission approved!");
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve submission");
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    setReviewingId(submissionId);
    try {
      const { error } = await supabase
        .from("social_bonus_submissions")
        .update({ is_approved: false })
        .eq("id", submissionId);

      if (error) throw error;

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId ? { ...sub, is_approved: false } : sub
        )
      );
      toast.success("Submission rejected");
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission");
    } finally {
      setReviewingId(null);
    }
  };

  const getScreenshotUrl = (path: string) => {
    return `/api/getImage?path=${encodeURIComponent(
      path
    )}&bucket=social_screenshots`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Social Bonus Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Social Bonus Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No submissions yet. Share the game on social media to earn{" "}
            {bonusPoints} bonus points!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Social Bonus Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold">
                    {submission.participant_nickname}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "gap-1 text-xs",
                      submission.is_approved === true
                        ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                        : submission.is_approved === false
                        ? "bg-red-100 text-red-800 hover:bg-red-100/80"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
                    )}
                  >
                    {submission.is_approved === true ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Approved
                      </>
                    ) : submission.is_approved === false ? (
                      <>
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </>
                    ) : (
                      "Pending Review"
                    )}
                  </Badge>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {submission.screenshot_urls.map((url, index) => (
                    <div
                      key={index}
                      className="group relative h-20 w-36 flex-shrink-0 rounded-md overflow-hidden border"
                    >
                      <Image
                        src={getScreenshotUrl(url)}
                        alt={`Screenshot ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => setExpandedImage(url)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Maximize2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {submission.is_approved === null && (
                <div className="flex gap-2 md:flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(submission.id)}
                    disabled={!!reviewingId}
                    className="gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(submission.id)}
                    disabled={!!reviewingId}
                    className="gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={!!expandedImage}
        onOpenChange={() => setExpandedImage(null)}
      >
        <DialogContent className="max-w-screen-lg">
          <DialogTitle>Preview</DialogTitle>
          {expandedImage && (
            <div className="relative aspect-[16/9]">
              <Image
                src={getScreenshotUrl(expandedImage)}
                alt="Expanded screenshot"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
