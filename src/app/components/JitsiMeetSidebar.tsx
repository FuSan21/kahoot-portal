import { JaaSMeeting } from "@jitsi/react-sdk";

interface JitsiMeetProps {
  jwt: string;
  roomName: string;
  avatar: string;
}

const JitsiMeetSidebar: React.FC<JitsiMeetProps> = ({
  jwt,
  roomName,
  avatar,
}) => {
  return (
    <JaaSMeeting
      appId="vpaas-magic-cookie-445f1d3e84bb47cfbb92b3849e0209ab"
      roomName={roomName || "AGT Quiz Portal"}
      jwt={jwt}
      configOverwrite={{
        disableThirdPartyRequests: true,
        disableLocalVideoFlip: true,
        backgroundAlpha: 0.5,
      }}
      interfaceConfigOverwrite={{
        VIDEO_LAYOUT_FIT: "nocrop",
        MOBILE_APP_PROMO: false,
        TILE_VIEW_MAX_COLUMNS: 1,
      }}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = "100%";
        iframeRef.style.width = "100%";
        iframeRef.style.flexGrow = "1";
      }}
      onApiReady={(api) => {
        api.executeCommand("avatarUrl", avatar);
      }}
    />
  );
};

export default JitsiMeetSidebar;
