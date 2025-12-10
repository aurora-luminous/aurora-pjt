import { useCallback, useEffect } from "react";
import { useCamera } from "./useCamera";
import { useLoadRedux } from "./useLoadRedux";
import { useMike } from "./useMike";
import { useScreenShare } from "./useScreenShare";

export const useMediaControl = () => {
  // 카메라 제어
  const { cameraStream, startCamera, stopCamera } = useCamera();
  const {
    isVideoOn,
    toggleMyVideo,
    setSpeaking,
    currentUserId,
    isMicOn,
    toggleMyMic,
    toggleMyScreenShare,
    isScreenSharing,
  } = useLoadRedux();

  // 마이크 제어
  const { mikeStream, startMike, stopMike } = useMike((isSpeking) => {
    setSpeaking(currentUserId, isSpeking);
  });

  // 화면 공유 제어
  const { screenStream, startScreenShare, stopScreenShare, changeScreenShare } =
    useScreenShare();
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

  // 화면 공유 토글
  const handleToggleScreenShare = useCallback(() => {
    // 1. Redux 상태 업데이트
    toggleMyScreenShare();

    // 2. 헌재 상태에 따라 화면공유 제어
    if (!isScreenSharing) {
      console.log("화면 공유 시작");
      startScreenShare(); // 켜저 있으면 끄기
    } else {
      console.log("화면 공유 종료");
      stopScreenShare(); // 꺼져 있으면 켜기
    }
  }, [isScreenSharing, toggleMyScreenShare, startScreenShare, stopScreenShare]);

  const handdleChangeScreenShare = useCallback(() => {
    if (!isScreenSharing) return;
    changeScreenShare();
  }, [isScreenSharing, changeScreenShare]);

  return {
    cameraStream,
    startCamera,
    stopCamera,
    handleToggleVideo,

    mikeStream,
    startMike,
    stopMike,
    handleToggleMic,

    screenStream,
    startScreenShare,
    stopScreenShare,
    handleToggleScreenShare,
    isScreenSharing,
    handdleChangeScreenShare,
  };
};
