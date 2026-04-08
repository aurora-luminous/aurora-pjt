import type { ServerAccess } from "../types";
import type { JoinRequest } from "../[server_id]/admin/hooks/useAdmin";

const statusMap: Record<string, JoinRequest["sStatus"]> = {
  Pending: "Pending",
  Active: "Active",
  Inactive: "Inactive",
  Banned: "Banned",
};

export const mapServerAccessToJoinRequest = (
  serverAccess: ServerAccess,
): JoinRequest => ({
  id: serverAccess.userInfo?.user_email ?? "",
  userName: serverAccess.userInfo?.user_name ?? "",
  userAvatar: serverAccess.userInfo?.profile_image_path ?? undefined,
  message: `${serverAccess.userInfo?.user_name}님이 서버 가입을 요청했습니다.`,
  requestDate: new Date().toISOString(),
  sStatus: statusMap[serverAccess.sStatus] ?? "Pending",
  userEmail: serverAccess.userInfo?.user_email ?? "",
});
