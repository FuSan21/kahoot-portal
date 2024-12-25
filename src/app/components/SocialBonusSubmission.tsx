"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/types/types";
import { toast } from "sonner";
import { SOCIAL_MEDIA_LINKS, SOCIAL_MEDIA_INSTRUCTIONS } from "@/types/enums";
import Image from "next/image";

interface SocialBonusSubmissionProps {
  gameId: string;
  participantId: string;
  bonusPoints: number;
}

interface SocialBonusSubmission {
  participant_id: string;
  screenshot_urls: string[];
  is_approved?: boolean;
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
  const [isApproved, setIsApproved] = useState(false);

  // Check for existing submission when component mounts
  useEffect(() => {
    const checkExistingSubmission = async () => {
      const { data, error } = await supabase
        .from("social_bonus_submissions")
        .select("id, is_approved")
        .eq("participant_id", participantId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error checking submission:", error);
        return;
      }

      if (data) {
        setHasSubmitted(true);
        setIsApproved(data.is_approved || false);
      }
    };

    checkExistingSubmission();
  }, [participantId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setScreenshots(files);

    // Create preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

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
      };

      const { error: submissionError } = await supabase
        .from("social_bonus_submissions")
        .insert(submission);

      if (submissionError) throw submissionError;

      toast.success("Your submission has been received!");
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error submitting social bonus:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit social bonus"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (hasSubmitted) {
    return (
      <div
        className={`bg-gradient-to-br ${
          isApproved
            ? "from-blue-400 to-blue-600"
            : "from-green-400 to-green-600"
        } rounded-2xl shadow-xl overflow-hidden mb-8 w-full max-w-2xl`}
      >
        <div className="backdrop-blur-sm bg-white/10 p-6 text-center text-white">
          <h3 className="text-xl mb-2">
            Social Bonus {isApproved ? "Approved!" : "Submitted!"}
          </h3>
          <p>
            {isApproved
              ? `You've earned ${bonusPoints} bonus points for sharing!`
              : "Your submission will be reviewed and bonus points will be awarded soon."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl shadow-xl overflow-hidden mb-8 w-full max-w-2xl">
      <div className="backdrop-blur-sm bg-white/10 p-6">
        <h3 className="text-xl text-white mb-4">
          Get {bonusPoints} Bonus Points!
        </h3>
        <div className="space-y-4">
          <p className="text-white">{SOCIAL_MEDIA_INSTRUCTIONS}</p>

          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(SOCIAL_MEDIA_LINKS).map(([platform, link]) => (
              <a
                key={platform}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded text-white transition flex items-center gap-2"
              >
                {platform}
              </a>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">
                Upload Screenshots
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full p-2 rounded bg-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/20 file:text-white hover:file:bg-white/30"
                required
              />
            </div>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || screenshots.length === 0}
              className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
