"use client";

import { useVoiceChannelPage } from "../../../../../hooks/useVoiceChannelPage";
import { useVoiceGrid } from "../../../../../hooks/useVoiceGrid";
import { useMediaControl } from "../../../../../hooks/useMediaControl";
import { useResponsive } from "../../../../../../lib/useResponsive";
import dynamic from "next/dynamic";
import {
  VoiceHeader,
  ScreenShareView,
  VoiceGrid,
  VoiceControlBar,
} from "../components";

// FullscreenButton을 클라이언트에서만 로드 (hydration 에러 방지)
const FullscreenButton = dynamic(
  () =>
    import("../components").then((mod) => ({ default: mod.FullscreenButton })),
  {
    ssr: false,
    loading: () => null, // 로딩 중에는 아무것도 보여주지 않음
  }
);

const VoiceChannelPage = () => {
  const { isMobile } = useResponsive();
  const {
    channelId,
    getChannelName,
    currentUserId,
    isMicOn,
    isFullScreen,
    isVideoOn,
    isScreenShareActive,
    participants,
    participantCount,
    toggleFullScreen,
  } = useVoiceChannelPage();

  // 미디어 제어 (카메라 포함)
  const {
    cameraStream,
    handleToggleVideo,
    mikeStream,
    handleToggleMic,
    screenStream,
    handleToggleScreenShare,
    isScreenSharing,
    handdleChangeScreenShare,
  } = useMediaControl();

  // 참여자 수에 따른 그리드 레이아웃 계산
  const { gridLayout, gridRows } = useVoiceGrid(
    channelId,
    participantCount,
    isMicOn,
    isVideoOn,
    isScreenShareActive,
    participants
  );

  return (
    <div className="h-full bg-aurora-voice text-white flex flex-col relative">
      {/* 상단 헤더 */}
      <VoiceHeader channelName={getChannelName(channelId)} />

      {/* 메인 비디오 영역 */}
      <div
        className={`
        flex-1 flex items-center justify-center
        ${isMobile ? "p-4" : "p-8"}
      `}
      >
        {isScreenShareActive ? (
          /* 화면 공유 모드 */
          <ScreenShareView
            participants={participants}
            currentUserId={currentUserId}
            cameraStream={cameraStream}
            mikeStream={mikeStream}
            screenStream={screenStream}
          />
        ) : (
          /* 일반 화상회의 모드 */
          <VoiceGrid
            participants={participants}
            gridLayout={gridLayout}
            gridRows={gridRows}
            currentUserId={currentUserId}
            cameraStream={cameraStream}
            mikeStream={mikeStream}
          />
        )}
      </div>

      {/* 하단 컨트롤 바 */}
      <VoiceControlBar
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChangeScreenShare={handdleChangeScreenShare}
      />

      {/* 전체화면 버튼 - 데스크탑/태블릿에서만 렌더링 */}
      {!isMobile && (
        <FullscreenButton
          onToggleFullscreen={toggleFullScreen}
          isFullScreen={isFullScreen}
        />
      )}
    </div>
  );
};

export default VoiceChannelPage;
