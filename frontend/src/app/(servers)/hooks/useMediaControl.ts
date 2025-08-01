import { useCallback } from "react";
import { useCamera } from "./useCamera";
import { useLoadRedux } from "./useLoadRedux";

export const useMediaControl = () => {
  const { cameraStream, startCamera, stopCamera } = useCamera();
  const { isVideoOn, toggleMyVideo } = useLoadRedux();

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

  return {
    cameraStream,
    startCamera,
    stopCamera,
    handleToggleVideo,
  };
};
