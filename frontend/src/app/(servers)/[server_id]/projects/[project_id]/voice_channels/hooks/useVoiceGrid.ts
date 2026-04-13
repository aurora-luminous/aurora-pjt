import { useMemo } from "react";

export const useVoiceGrid = (
  channelId: string,
  participantCount: number,
  isMicOn: boolean,
  isVideoOn: boolean,
  isScreenShareActive: boolean,
  participants: { [key: string]: any }
) => {
  // 참여자 수에 따른 그리드 레이아웃 계산
  const getGridLayout = useMemo(() => {
    if (participantCount === 1) return "grid-cols-1";
    if (participantCount === 2) return "grid-cols-2";
    if (participantCount <= 4) return "grid-cols-2";
    if (participantCount <= 6) return "grid-cols-3";
    if (participantCount <= 9) return "grid-cols-3";
    return "grid-cols-4";
  }, [participantCount]);

  const getGridRows = useMemo(() => {
    if (participantCount <= 2) return "grid-rows-1";
    if (participantCount <= 6) return "grid-rows-2";
    if (participantCount <= 12) return "grid-rows-3";
    return "grid-rows-4";
  }, [participantCount]);

  // 디버깅 정보
  const debugInfo = useMemo(
    () => ({
      channelId,
      participantCount,
      isMicOn,
      isVideoOn,
      isScreenShareActive,
      participants: Object.keys(participants),
      gridLayout: getGridLayout,
      gridRows: getGridRows,
    }),
    [
      channelId,
      participantCount,
      isMicOn,
      isVideoOn,
      isScreenShareActive,
      participants,
      getGridLayout,
      getGridRows,
    ]
  );

  return {
    gridLayout: getGridLayout,
    gridRows: getGridRows,
    debugInfo,
  };
};
