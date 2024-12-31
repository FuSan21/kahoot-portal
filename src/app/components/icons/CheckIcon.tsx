import React from "react";
import { cn } from "@/lib/utils";

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const CheckIcon: React.FC<CheckIconProps> = ({ className, ...props }) => (
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
      d="m4.5 12.75 6 6 9-13.5"
    />
  </svg>
);

export default CheckIcon;
