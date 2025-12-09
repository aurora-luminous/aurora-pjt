import { useApi } from "react-easy-api";
import {
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
  ChangePermission,
  RolePermisson,
} from "../types/Server";
import { expressClient } from "@/app/lib/axiosClient";
import { Project } from "../types/Projcets";
import { Channel } from "../types/Channel";
import { ServerAccess, ServerStatus } from "@/app/(servers)/types/ServerAccess";

// 서버 생성
export const useAddServerApi = () => {
  return useApi<ServerResponse, ServerRequest>({
    endpoint: "/ex/servers",
    method: "POST",
    axiosInstance: expressClient,
  });
};

// 서버 목록 조회 (오타 수정)
export const useServerListApi = () => {
  return useApi<ServerListItem[], void>({
    endpoint: "/ex/servers",
    method: "GET",
    axiosInstance: expressClient,
  });
};

// 프로젝트 목록 조회
export const useProjectListApi = (serverUrl: string) => {
  return useApi<Project[], void>({
    endpoint: `/ex/servers/${serverUrl}/projects`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

// 프로젝트 생성
export const useCreateProjectApi = (serverUrl: string) => {
  return useApi<Project, { projectName: string; projectDescription?: string }>({
    endpoint: `/ex/servers/${serverUrl}/projects`,
    method: "POST",
    axiosInstance: expressClient,
  });
};

// 채널 목록 조회
export const useChannelListApi = (serverUrl: string, projectPk: number) => {
  return useApi<Channel[], void>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

// 채널 생성
export const useCreateChannelApi = (serverUrl: string, projectPk: number) => {
  return useApi<
    Channel,
    Omit<Channel, "channelName"> & { channelName?: string }
  >({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels`,
    method: "POST",
    axiosInstance: expressClient,
  });
};

// 서버 접근 권한 조회 (관리자용)
export const useServerAccessApi = (serverUrl: string) => {
  return useApi<ServerAccess[], void>({
    endpoint: `/ex/servers/${serverUrl}/pending`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

// 서버 가입 상태 조회 (사용자용)
export const useServerJoinStatusApi = (serverUrl: string) => {
  return useApi<ServerAccess[], void>({
    endpoint: `/ex/servers/${serverUrl}/join`,
    method: "POST",
    axiosInstance: expressClient,
  });
};

// 서버 접근 권한 수정
export const usePatchServerAccessApi = (serverUrl: string) => {
  return useApi<ServerAccess, { sStatus: ServerStatus; userEmail: string }>({
    endpoint: `/ex/servers/${serverUrl}/members`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

// 초대 코드 생성
export const useCreateInviteCodeApi = (serverUrl: string) => {
  return useApi<InviteCode, void>({
    endpoint: `/ex/servers/${serverUrl}/invite`,
    method: "POST",
    axiosInstance: expressClient,
  });
};

// 서버 멤버 조회
export const useUserMemberListApi = (serverUrl: string) => {
  return useApi<MemberInfo[], void>({
    endpoint: `/ex/servers/${serverUrl}/members`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

export const useInviteProjectApi = (serverUrl: string, projectPk: number) => {
  return useApi<{ message: string }, MemberEmail[] | string[]>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/invite`,
    method: "POST",
    axiosInstance: expressClient,
  });
};

export const useProjectMemberListApi = (
  serverUrl: string,
  projectPk: number
) => {
  return useApi<ProjectMemberInfo[], void>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/members`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

export const useLeaveProjectApi = (serverUrl: string, projectPk: number) => {
  return useApi<{ message: string }, MemberEmail>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/members/remove`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

export const useBanProjectMemberApi = (
  serverUrl: string,
  projectPk: number
) => {
  return useApi<{ message: string }, MemberEmail>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/members/ban`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

export const useUnbanProjectMemberApi = (
  serverUrl: string,
  projectPk: number
) => {
  return useApi<{ message: string }, MemberEmail>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/members/unban`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

export const useInvitePrivateChannelApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useApi<{ message: string }, MemberEmail[]>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/invite`,
    method: "POST",
    axiosInstance: expressClient,
  });
};

export const useChannelMemberListApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useApi<ChannelMemberInfo[], void>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

export const useKickChannelMemberApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useApi<{ message: string }, MemberEmail>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members`,
    method: "DELETE",
    axiosInstance: expressClient,
  });
};

export const useBanChannelMemberApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useApi<{ message: string }, MemberEmail>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members/ban`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

export const useUnbanChannelMemberApi = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useApi<{ message: string }, MemberEmail>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members/unban`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

export const useServerRoleApi = (serverUrl: string) => {
  return useApi<RoleResponse, RoleUsers>({
    endpoint: `/ex/servers/${serverUrl}/members/roles`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};

export const useServerPermessionApi = (serverUrl: string) => {
  return useApi<RolePermessionResponse, void>({
    endpoint: `/ex/servers/${serverUrl}/permissions`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

export const usePatchServerPermessionApi = (serverUrl: string) => {
  return useApi<RolePermisson, ChangePermission>({
    endpoint: `/ex/servers/${serverUrl}/permissions/roles`,
    method: "PATCH",
    axiosInstance: expressClient,
  });
};
