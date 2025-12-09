import { useCallback, useEffect } from "react";
import { useCamera } from "./useCamera";
import { useLoadRedux } from "./useLoadRedux";
import { useMike } from "./useMike";

export const useMediaControl = () => {
  // 카메라 제어
  const { cameraStream, startCamera, stopCamera } = useCamera();
  const { isVideoOn, toggleMyVideo, setSpeaking, currentUserId, isMicOn, toggleMyMic } =
    useLoadRedux();

  // 마이크 제어
  const { mikeStream, startMike, stopMike } = useMike((isSpeking) => {
    setSpeaking(currentUserId, isSpeking);
  });
  // 음성 채널 입장 시 바로 마이크 on
  useEffect(() => {
    startMike();
    // 클린 업 함수로 마이크 중지
    return () => {
      stopMike();
    };
  }, []);

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
    // 1. Redux 상태 업데이트
    toggleMyMic();

    // 2. 현재 상태에 따라 마이크 제어
    if (isMicOn) {
      stopMike(); // 켜져 있으면 끄기
    } else {
      startMike(); // 꺼져 있으면 켜기
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
