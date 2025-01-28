import { JaaSMeeting } from "@jitsi/react-sdk";
import { useEffect, useState } from "react";
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Sheet, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import JitsiIcon from "@/app/components/icons/JitsiIcon";
import type { ComponentRef } from "react";

const sheetVariants = cva(
  "fixed z-50 bg-background shadow-lg transition-all duration-300 ease-in-out",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full border-l data-[state=closed]:translate-x-full sm:max-w-[600px] w-[90vw]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

const CustomSheetContent = React.forwardRef<
  ComponentRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side: "right" }), className)}
      onInteractOutside={(e) => {
        e.preventDefault();
      }}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
      }}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
CustomSheetContent.displayName = "JitsiMeetSheetContent";

interface JitsiMeetProps {
  jwt: string;
  roomName: string;
  onReadyToClose?: () => void;
  isOpen: boolean;
  isMinimized: boolean;
  onOpenChange: (open: boolean) => void;
  onMinimizeChange: (minimized: boolean) => void;
  isMeetingClosed: boolean;
  onJitsiIconClick: () => void;
}

const renderSpinner = () => (
  <div style={spinnerContainerStyle}>
    <div style={spinnerStyle}></div>
  </div>
);

const spinnerContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  fontFamily: "sans-serif",
};

const spinnerStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  border: "4px solid rgba(0, 0, 0, 0.1)",
  borderTop: "4px solid #3498db",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const spinnerKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const JitsiMeetSidebar: React.FC<JitsiMeetProps> = ({
  jwt,
  roomName,
  onReadyToClose,
  isOpen,
  isMinimized,
  onOpenChange,
  onMinimizeChange,
  isMeetingClosed,
  onJitsiIconClick,
}) => {
  useEffect(() => {
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(spinnerKeyframes));
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleReadyToClose = () => {
    onReadyToClose?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <CustomSheetContent
        className={`p-0 transition-all duration-300 ease-in-out ${
          isMinimized ? "translate-x-full border-l-0" : ""
        }`}
        forceMount
      >
        <div className="relative h-full">
          <div
            className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 z-[51] ${
              isMinimized ? "-left-[40px]" : "-left-10"
            }`}
          >
            <JitsiIcon
              className={`w-10 h-10 
                ${isMeetingClosed ? "bg-red-500" : "bg-sky-500"} 
                hover:${isMeetingClosed ? "bg-red-400" : "bg-sky-400"} 
                cursor-pointer
                transition-all duration-300 ease-in-out transform
                text-white rounded-l-full shadow-md`}
              onClick={onJitsiIconClick}
            />
          </div>
          <div
            className={`h-full ${
              isMinimized ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300`}
          >
            <JaaSMeeting
              appId="vpaas-magic-cookie-445f1d3e84bb47cfbb92b3849e0209ab"
              roomName={roomName || "Kahoot Portal"}
              jwt={jwt}
              configOverwrite={{
                disableLocalVideoFlip: true,
                backgroundAlpha: 0.5,
                startWithAudioMuted: true,
                startWithVideoMuted: true,
                prejoinPageEnabled: false,
                startAudioOnly: true,
              }}
              interfaceConfigOverwrite={{
                VIDEO_LAYOUT_FIT: "both",
                MOBILE_APP_PROMO: false,
                TILE_VIEW_MAX_COLUMNS: 5,
              }}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = "100%";
                iframeRef.style.width = "100%";
              }}
              onReadyToClose={handleReadyToClose}
              spinner={renderSpinner}
            />
          </div>
        </div>
      </CustomSheetContent>
    </Sheet>
  );
};

export default JitsiMeetSidebar;
