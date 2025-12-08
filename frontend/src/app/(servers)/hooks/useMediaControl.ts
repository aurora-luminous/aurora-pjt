import { useCallback } from "react";
import { useCamera } from "./useCamera";
import { useLoadRedux } from "./useLoadRedux";
import { useMike } from "./useMike";

export const useMediaControl = () => {
  // 카메라 제어
  const { cameraStream, startCamera, stopCamera } = useCamera();
  const { isVideoOn, toggleMyVideo } = useLoadRedux();

  // 마이크 제어
  const { mikeStream, startMike, stopMike } = useMike();
  const { isMicOn, toggleMyMic } = useLoadRedux();

  // 비디오 토글
  const handleToggleVideo = useCallback(() => {
    // 1. Redux 상태 먼저 업데이트
    toggleMyVideo();

    // 2. 현재 상태에 따라 카메라 제어
    if (isVideoOn) {
      stopCamera(); // 현재 켜져있으면 끄기
    } else {
      startCamera(); // 현재 꺼져있으면 켜기
    }
  }, [isVideoOn, toggleMyVideo, startCamera, stopCamera, cameraStream]);

  // 마이크 토글
  const handleToggleMic = useCallback(() => {
    toggleMyMic();

    if (isMicOn) {
      stopMike();
    } else {
      startMike();
    }
  }, [isMicOn, toggleMyMic, startMike, stopMike]);

  return {
    cameraStream,
    startCamera,
    stopCamera,
    handleToggleVideo,
    handleToggleMic,
    mikeStream,
    startMike,
    stopMike,
  };
};
