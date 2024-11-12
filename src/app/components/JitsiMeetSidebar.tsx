import { JaaSMeeting } from "@jitsi/react-sdk";
import { useEffect } from "react";

interface JitsiMeetProps {
  jwt: string;
  roomName: string;
  onReadyToClose?: () => void;
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
}) => {
  useEffect(() => {
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(spinnerKeyframes));
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
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
        iframeRef.style.flexGrow = "1";
      }}
      onReadyToClose={onReadyToClose}
      spinner={renderSpinner}
    />
  );
};

export default JitsiMeetSidebar;
