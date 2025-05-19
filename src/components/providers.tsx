"use client";

import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 34 }}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
