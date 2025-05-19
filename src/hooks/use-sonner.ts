"use client";

import { toast as sonnerToast, ToastT } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info";
  duration?: number;
};

function toast(props: ToastProps) {
  const { title, description, variant, duration } = props;

  const options = { duration };

  switch (variant) {
    case "destructive":
      return title
        ? sonnerToast.error(title, { description, ...options })
        : sonnerToast.error(description!, options);
    case "success":
      return title
        ? sonnerToast.success(title, { description, ...options })
        : sonnerToast.success(description!, options);
    case "info":
      return title
        ? sonnerToast.info(title, { description, ...options })
        : sonnerToast.info(description!, options);
    default:
      return title
        ? sonnerToast(title, { description, ...options })
        : sonnerToast(description!, options);
  }
}

// Add convenience methods
toast.error = (message: string) =>
  toast({ description: message, variant: "destructive" });
toast.success = (message: string) =>
  toast({ description: message, variant: "success" });
toast.info = (message: string) =>
  toast({ description: message, variant: "info" });

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { toast };
