import { ServerListItem } from "../types/Server";

/**
 * 서버 접근 권한 확인 유틸리티
 */
export const checkServerAccess = (
  serverList: ServerListItem[],
  serverUrl: string,
  serverName: string
): boolean => {
  return serverList.some(
    (server: ServerListItem) =>
      server.serverUrl === serverUrl || server.serverName === serverName
  );
};

/**
 * 승인 대기 페이지 URL 생성
 */
export const createPendingPageUrl = (
  serverUrl: string,
  serverName: string
): string => {
  return `/pending?serverUrl=${encodeURIComponent(
    serverUrl
  )}&serverName=${encodeURIComponent(serverName)}`;
};

/**
 * 채널 타입에 따른 경로 결정
 */
export const getChannelPath = (channelKind: string): string => {
  switch (channelKind) {
    case "voice":
      return "voice_channels";
    case "text":
    case "notice":
    default:
      return "channels";
  }
};

/**
 * 채널 URL 생성
 */
export const createChannelUrl = (
  serverUrl: string,
  projectPk: number,
  channelName: string,
  channelKind: string
): string => {
  const encodedChannelName = encodeURIComponent(channelName);
  const channelPath = getChannelPath(channelKind);
  return `/${serverUrl}/projects/${projectPk}/${channelPath}/${encodedChannelName}`;
};
