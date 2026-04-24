import { expressClient } from "@/app/lib/axiosClient";
import type {
  ServerRequest,
  ServerResponse,
  ServerListItem,
  InviteCode,
  MemberInfo,
  MemberEmail,
  ChannelMemberInfo,
  ProjectMemberInfo,
  RoleResponse,
  RoleUsers,
  RolePermessionResponse,
  RolePermisson,
  ChangePermission,
  Project,
  Channel,
  ChannelRequest,
  LastChannelResponse,
  ChannelPayload,
  ProjectPayload,
  UserInfo,
  SearchString,
} from "../types";
import type {
  ServerAccess,
  ServerStatus,
  ChannelInfo,
} from "@/app/(servers)/types";

// ─── Server ──────────────────────────────────────────────────────────────────

export const addServerApi = (data: ServerRequest): Promise<ServerResponse> =>
  expressClient
    .post<ServerResponse>("/ex/servers", data)
    .then((res) => res.data);

export const getServerListApi = (): Promise<ServerListItem[]> =>
  expressClient.get<ServerListItem[]>("/ex/servers").then((res) => res.data);

export const deleteServerApi = (
  serverUrl: string,
): Promise<{ message: string }> =>
  expressClient
    .patch<{ message: string }>(`/ex/servers/${serverUrl}/delete`)
    .then((res) => res.data);

// ─── Server Access / Join ─────────────────────────────────────────────────────

export const getServerAccessApi = (
  serverUrl: string,
): Promise<ServerAccess[]> =>
  expressClient
    .get<ServerAccess[]>(`/ex/servers/${serverUrl}/pending`)
    .then((res) => res.data);

export const joinServerApi = (
  serverUrl: string,
): Promise<ServerAccess | { message: string }> =>
  expressClient
    .post<ServerAccess | { message: string }>(`/ex/servers/${serverUrl}/join`)
    .then((res) => res.data);

export const patchServerAccessApi = (
  serverUrl: string,
  data: { sStatus: ServerStatus; userEmail: string },
): Promise<ServerAccess> =>
  expressClient
    .patch<ServerAccess>(`/ex/servers/${serverUrl}/members`, data)
    .then((res) => res.data);

// ─── Invite ───────────────────────────────────────────────────────────────────

export const createInviteCodeApi = (serverUrl: string): Promise<InviteCode> =>
  expressClient
    .post<InviteCode>(`/ex/servers/${serverUrl}/invite`)
    .then((res) => res.data);

// ─── Members ─────────────────────────────────────────────────────────────────

export const getServerMemberListApi = (
  serverUrl: string,
): Promise<MemberInfo[]> =>
  expressClient
    .get<MemberInfo[]>(`/ex/servers/${serverUrl}/members`)
    .then((res) => res.data);

export const patchServerRoleApi = (
  serverUrl: string,
  data: RoleUsers,
): Promise<RoleResponse> =>
  expressClient
    .patch<RoleResponse>(`/ex/servers/${serverUrl}/members/roles`, data)
    .then((res) => res.data);

// ─── Permissions ─────────────────────────────────────────────────────────────

export const getServerPermissionsApi = (
  serverUrl: string,
): Promise<RolePermessionResponse> =>
  expressClient
    .get<RolePermessionResponse>(`/ex/servers/${serverUrl}/permissions`)
    .then((res) => res.data);

export const patchServerPermissionsApi = (
  serverUrl: string,
  data: ChangePermission,
): Promise<RolePermisson> =>
  expressClient
    .patch<RolePermisson>(`/ex/servers/${serverUrl}/permissions`, data)
    .then((res) => res.data);

// ─── Projects ─────────────────────────────────────────────────────────────────

export const getProjectListApi = (serverUrl: string): Promise<Project[]> =>
  expressClient
    .get<Project[]>(`/ex/servers/${serverUrl}/projects`)
    .then((res) => res.data);

export const createProjectApi = (
  serverUrl: string,
  data: { projectName: string; projectDescription?: string },
): Promise<Project> =>
  expressClient
    .post<Project>(`/ex/servers/${serverUrl}/projects`, data)
    .then((res) => res.data);

export const deleteProjectApi = (
  serverUrl: string,
  projectPk: number,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(`/ex/servers/${serverUrl}/projects/${projectPk}/delete`)
    .then((res) => res.data);

export const updateProjectApi = (
  serverUrl: string,
  projectPk: number,
  data: ProjectPayload,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(`/ex/servers/${serverUrl}/projects/${projectPk}/update`, data)
    .then((res) => res.data);

// ─── Project Members ──────────────────────────────────────────────────────────

export const getProjectMemberListApi = (
  serverUrl: string,
  projectPk: number,
): Promise<ProjectMemberInfo[]> =>
  expressClient
    .get<
      ProjectMemberInfo[]
    >(`/ex/servers/${serverUrl}/projects/${projectPk}/members`)
    .then((res) => res.data);

export const inviteProjectApi = (
  serverUrl: string,
  projectPk: number,
  data: MemberEmail[],
): Promise<{ message: string }> =>
  expressClient
    .post<{
      message: string;
    }>(`/ex/servers/${serverUrl}/projects/${projectPk}/invite`, data)
    .then((res) => res.data);

export const leaveProjectApi = (
  serverUrl: string,
  projectPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(`/ex/servers/${serverUrl}/projects/${projectPk}/members/remove`, data)
    .then((res) => res.data);

export const banProjectMemberApi = (
  serverUrl: string,
  projectPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(`/ex/servers/${serverUrl}/projects/${projectPk}/members/ban`, data)
    .then((res) => res.data);

export const unbanProjectMemberApi = (
  serverUrl: string,
  projectPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(`/ex/servers/${serverUrl}/projects/${projectPk}/members/unban`, data)
    .then((res) => res.data);

// ─── Channels ─────────────────────────────────────────────────────────────────

export const getChannelListApi = (
  serverUrl: string,
  projectPk: number,
): Promise<Channel[]> =>
  expressClient
    .get<Channel[]>(`/ex/servers/${serverUrl}/projects/${projectPk}/channels`)
    .then((res) => res.data);

export const createChannelApi = (
  serverUrl: string,
  projectPk: number,
  data: ChannelRequest,
): Promise<Channel> =>
  expressClient
    .post<Channel>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels`,
      data,
    )
    .then((res) => res.data);

export const deleteChannelApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/delete`,
    )
    .then((res) => res.data);

export const updateChannelApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
  data: ChannelPayload,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/update`,
      data,
    )
    .then((res) => res.data);

// ─── Channel Members ──────────────────────────────────────────────────────────

export const getChannelMemberListApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
): Promise<ChannelMemberInfo[]> =>
  expressClient
    .get<
      ChannelMemberInfo[]
    >(`/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members`)
    .then((res) => res.data);

export const invitePrivateChannelApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
  data: MemberEmail[],
): Promise<{ message: string }> =>
  expressClient
    .post<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/invite`,
      data,
    )
    .then((res) => res.data);

export const leaveChannelApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members/remove`,
      data,
    )
    .then((res) => res.data);

export const kickChannelMemberApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .delete<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members`,
      { data },
    )
    .then((res) => res.data);

export const banChannelMemberApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members/ban`,
      data,
    )
    .then((res) => res.data);

export const unbanChannelMemberApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number,
  data: MemberEmail,
): Promise<{ message: string }> =>
  expressClient
    .patch<{
      message: string;
    }>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members/unban`,
      data,
    )
    .then((res) => res.data);

// ─── My Channels / Last Channel ───────────────────────────────────────────────

export const getMyChannelsApi = (): Promise<ChannelInfo[]> =>
  expressClient.get<ChannelInfo[]>("/ex/my-channels").then((res) => res.data);

export const getLastChannelApi = (): Promise<LastChannelResponse> =>
  expressClient
    .get<LastChannelResponse>("/ex/members/me/last-channel")
    .then((res) => res.data);

export const updateLastChannelApi = (
  channelPk: number,
): Promise<{ message: string }> =>
  expressClient
    .patch<{ message: string }>(`/ex/members/me/last-channel/${channelPk}`)
    .then((res) => res.data);

export const searchProjectMemberApi = (
  serverUrl: string,
  projectPk: number,
  data: SearchString,
): Promise<UserInfo[]> =>
  expressClient
    .post<UserInfo[]>(
      `/ex/servers/${serverUrl}/projects/${projectPk}/member`,
      data,
    )
    .then((res) => res.data);
