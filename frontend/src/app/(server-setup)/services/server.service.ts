import type { ServerInfo } from "../types";
import { ChannelKind, AccessType } from "../types";
import {
  getProjectListApi,
  getChannelListApi,
  createChannelApi,
  joinServerApi,
} from "../api/server.api";
import { createChannelUrl, createPendingPageUrl } from "../utils/serverAccessUtils";
import type { ServerAccess } from "@/app/(servers)/types/ServerAccess";
import axios from "axios";

export interface ServerConnectionResult {
  serverInfo: ServerInfo;
  targetUrl: string;
}

export type ServerConnectionOutcome =
  | { type: "connected"; result: ServerConnectionResult }
  | { type: "pending"; pendingUrl: string }
  | { type: "deleted"; error: unknown };

/**
 * 서버 연결 플로우의 순수 비즈니스 로직
 * - joinServerApi 응답으로 접근 권한 확인
 * - 첫 프로젝트/채널 조회 (없으면 기본 채널 생성)
 * - ServerInfo + 네비게이션 URL 반환
 * React에 종속되지 않는 순수 async 함수
 */
export const resolveServerConnection = async (
  serverUrl: string,
  serverName: string
): Promise<ServerConnectionOutcome> => {
  // 1. 서버 입장 요청 및 접근 권한 확인
  let joinResult: ServerAccess | { message: string };
  try {
    joinResult = await joinServerApi(serverUrl);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        return { type: "deleted", error: err };
      }
    }
    throw err;
  }

  // 서버가 존재하지 않는 경우 ({ message } 응답)
  if ("message" in joinResult && !("sStatus" in joinResult)) {
    return { type: "deleted", error: new Error((joinResult as { message: string }).message) };
  }

  const { sStatus } = joinResult as ServerAccess;

  switch (sStatus) {
    case "Pending":
      return { type: "pending", pendingUrl: createPendingPageUrl(serverUrl, serverName) };
    case "Inactive":
    case "Banned":
      return { type: "deleted", error: new Error("가입이 거절된 서버입니다.") };
    case "Active":
      break;
    default:
      return { type: "pending", pendingUrl: createPendingPageUrl(serverUrl, serverName) };
  }

  // 2. 프로젝트 목록 조회
  const projects = await getProjectListApi(serverUrl);

  if (!projects || projects.length === 0) {
    return { type: "pending", pendingUrl: createPendingPageUrl(serverUrl, serverName) };
  }

  const firstProject = projects[0];

  // 3. 채널 목록 조회 (없으면 기본 채널 생성)
  const channels = await getChannelListApi(serverUrl, firstProject.projectPk);

  let targetChannel;
  if (!channels || channels.length === 0) {
    targetChannel = await createChannelApi(serverUrl, firstProject.projectPk, {
      channelName: "general",
      channelKind: ChannelKind.TEXT,
      accessType: AccessType.PUBLIC,
    });
  } else {
    targetChannel = channels[0];
  }

  if (!targetChannel) {
    throw new Error("채널을 찾거나 생성할 수 없습니다.");
  }

  // 4. ServerInfo 구성 및 URL 생성
  const serverInfo: ServerInfo = {
    serverName,
    serverUrl,
    projectName: firstProject.projectName,
    projectPk: firstProject.projectPk,
    channelName: targetChannel.channelName,
    role: "",
  };

  const targetUrl = createChannelUrl(
    serverUrl,
    firstProject.projectPk,
    targetChannel.channelPk,
    targetChannel.channelKind
  );

  return { type: "connected", result: { serverInfo, targetUrl } };
};
