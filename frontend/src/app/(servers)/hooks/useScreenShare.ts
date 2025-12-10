import { useState, useRef } from "react";

export const useScreenShare = () => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  // WebRTC sender를 외부에서 주입해야 replaceTrack 가능
  const senderRef = useRef<RTCRtpSender | null>(null);

  /** 외부에서 sender 주입하는 함수 (화면 트랙 보낼 sender) */
  const setSender = (sender: RTCRtpSender) => {
    senderRef.current = sender;
  };

  /** 화면 공유 시작 */
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const track = stream.getVideoTracks()[0];

      // 브라우저에서 사용자가 직접 공유를 끄면 자동 처리
      track.onended = () => stopScreenShare();

      // WebRTC 전송 트랙 연결
      if (senderRef.current) {
        await senderRef.current.replaceTrack(track);
      }

      setScreenStream(stream);
      setScreenError(null);

      return stream;
    } catch (err) {
      setScreenError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  };

  /** 화면 공유 종료 */
  const stopScreenShare = () => {
    if (screenStream) {
      // 기존 스트림 종료
      screenStream?.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
    }

    // 송출 중단 (비디오 트랙 제거)
    if (senderRef.current) {
      senderRef.current.replaceTrack(null);
    }
  };

  /** 화면 공유 변경 (창만 다시 선택) */
  const changeScreenShare = async () => {
    if (!screenStream) return;

    try {
      // 새 화면 선택창 띄움 (여기서 1번만 뜸)
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const newTrack = newStream.getVideoTracks()[0];

      // 선택 취소하면 newTrack 없음 → 아무 것도 안 바꿈
      if (!newTrack) return;

      // 기존 트랙 종료
      screenStream.getTracks().forEach((t) => t.stop());

      // replaceTrack으로 화면만 교체
      if (senderRef.current) {
        await senderRef.current.replaceTrack(newTrack);
      }

      // 상태 업데이트
      setScreenStream(newStream);

      // 변경한 화면이 종료될 경우 처리
      newTrack.onended = () => stopScreenShare();
    } catch (err) {
      // ❗ 취소 시 여기로 들어오지만 기존 공유 유지됨
      console.log("화면 공유 변경 취소됨:", err);
    }
  };

  return {
    screenStream,
    screenError,

    startScreenShare,
    stopScreenShare,
    changeScreenShare,

    // WebRTC RTCRtpSender 주입
    setSender,
  };
};
