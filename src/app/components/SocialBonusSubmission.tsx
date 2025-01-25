"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import { SOCIAL_MEDIA_LINKS, SOCIAL_MEDIA_INSTRUCTIONS } from "@/types/enums";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiFileUpload } from "@/components/ui/multi-file-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialBonusSubmissionProps {
  gameId: string;
  participantId: string;
  bonusPoints: number;
}

interface SocialBonusSubmission {
  participant_id: string;
  screenshot_urls: string[];
  status: "pending" | "approved" | "rejected";
}

export default function SocialBonusSubmission({
  gameId,
  participantId,
  bonusPoints,
}: SocialBonusSubmissionProps) {
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  useEffect(() => {
    const channel = supabase.channel(`social_bonus_${participantId}`);

    const checkExistingSubmission = async () => {
      const { data, error } = await supabase
        .from("social_bonus_submissions")
        .select("id, status")
        .eq("participant_id", participantId)
        .single();

      if (error && error.code !== "PGRST116") {
        toast.error("Error checking submission status");
        return;
      }

      if (data) {
        setHasSubmitted(true);
        setSubmissionStatus(data.status as "pending" | "approved" | "rejected");
      }
    };

    checkExistingSubmission();

    // Setup subscription
    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "social_bonus_submissions",
          filter: `participant_id=eq.${participantId}`,
        },
        (payload) => {
          setSubmissionStatus(
            payload.new.status as "pending" | "approved" | "rejected"
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [participantId]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (screenshots.length === 0) {
      toast.error("Please select at least one screenshot to upload");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload screenshots to storage
      const screenshotUrls = await Promise.all(
        screenshots.map(async (screenshot, index) => {
          const screenshotPath = `${gameId}/${participantId}/${index}_${screenshot.name}`;
          const { error: uploadError } = await supabase.storage
            .from("social_screenshots")
            .upload(screenshotPath, screenshot);

          if (uploadError) throw uploadError;
          return screenshotPath;
        })
      );

      // Create submission record
      const submission: SocialBonusSubmission = {
        participant_id: participantId,
        screenshot_urls: screenshotUrls,
        status: "pending",
      };

      const { error: submissionError } = await supabase
        .from("social_bonus_submissions")
        .insert(submission);

      if (submissionError) throw submissionError;

      toast.success("Your submission has been received!");
      setHasSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit social bonus"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <Badge
              variant="secondary"
              className={cn(
                "gap-2 text-lg py-2 px-4",
                submissionStatus === "approved"
                  ? "bg-green-100 text-green-800 hover:bg-green-100/80"
                  : submissionStatus === "rejected"
                  ? "bg-red-100 text-red-800 hover:bg-red-100/80"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
              )}
            >
              <CheckCircle className="h-5 w-5" />
              {submissionStatus === "approved"
                ? "Bonus Points Awarded!"
                : submissionStatus === "rejected"
                ? "Submission Rejected"
                : "Submission Received!"}
            </Badge>
            <p className="text-center text-muted-foreground">
              {submissionStatus === "approved"
                ? `You've earned ${bonusPoints} bonus points for sharing!`
                : submissionStatus === "rejected"
                ? "Your submission was not approved. Please try again with a new submission."
                : "Your submission will be reviewed and bonus points will be awarded soon."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-6 w-6" />
          Get {bonusPoints} Bonus Points!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">{SOCIAL_MEDIA_INSTRUCTIONS}</p>

        <div className="flex flex-wrap gap-2">
          {Object.entries(SOCIAL_MEDIA_LINKS).map(([platform, link]) => (
            <Button
              key={platform}
              variant="secondary"
              asChild
              className="gap-2"
            >
              <a href={link} target="_blank" rel="noopener noreferrer">
                {platform}
              </a>
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <MultiFileUpload
            value={screenshots}
            onChange={(files) => {
              setScreenshots(files);
              // Create preview URLs
              const urls = files.map((file) => URL.createObjectURL(file));
              setPreviewUrls(urls);
            }}
            onRemove={(index) => {
              const newScreenshots = [...screenshots];
              const newPreviewUrls = [...previewUrls];
              URL.revokeObjectURL(newPreviewUrls[index]);
              newScreenshots.splice(index, 1);
              newPreviewUrls.splice(index, 1);
              setScreenshots(newScreenshots);
              setPreviewUrls(newPreviewUrls);
            }}
            accept={{ "image/*": [] }}
          />

          {previewUrls.length > 0 && (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-md overflow-hidden border"
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || screenshots.length === 0}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
