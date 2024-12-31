import React from "react";
import { cn } from "@/lib/utils";

interface CrossIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const CrossIcon: React.FC<CrossIconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={5}
    stroke="currentColor"
    className={cn("w-6 h-6", className)}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

export default CrossIcon;
