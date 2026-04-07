import type { ServerInfo } from "../types";
import { joinServerApi } from "../api/server.api";
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

export const resolveServerConnection = async (
  serverUrl: string,
  serverName: string
): Promise<ServerConnectionOutcome> => {
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

  if ("message" in joinResult && !("sStatus" in joinResult)) {
    return { type: "deleted", error: new Error((joinResult as { message: string }).message) };
  }

  const { sStatus, defaultProject, defaultChannel } = joinResult as ServerAccess;

  switch (sStatus) {
    case "Pending":
      return { type: "pending", pendingUrl: createPendingPageUrl(serverUrl, serverName) };
    case "Inactive":
    case "Banned":
      return { type: "deleted", error: new Error("가입이 거절된 서버입니다.") };
    case "Active": {
      if (!defaultProject || !defaultChannel) {
        return { type: "pending", pendingUrl: createPendingPageUrl(serverUrl, serverName) };
      }

      const serverInfo: ServerInfo = {
        serverName,
        serverUrl,
        projectName: defaultProject.projectName,
        projectPk: defaultProject.projectPk,
        channelName: defaultChannel.channelName,
        role: "",
      };

      const targetUrl = createChannelUrl(
        serverUrl,
        defaultProject.projectPk,
        defaultChannel.channelPk,
        defaultChannel.channelKind ?? "text"
      );

      return { type: "connected", result: { serverInfo, targetUrl } };
    }
    default:
      return { type: "pending", pendingUrl: createPendingPageUrl(serverUrl, serverName) };
  }
};
