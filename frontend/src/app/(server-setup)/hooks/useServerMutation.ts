import type {
  ServerRequest,
  ChangePermission,
  RoleUsers,
  ChannelRequest,
  ChannelPayload,
  ProjectPayload,
} from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";
import type { ServerStatus } from "@/app/(servers)/types/ServerAccess";
import {
  addServerApi,
  getServerListApi,
  getProjectListApi,
  createProjectApi,
  getChannelListApi,
  createChannelApi,
  getServerAccessApi,
  joinServerApi,
  patchServerAccessApi,
  createInviteCodeApi,
  getServerMemberListApi,
  inviteProjectApi,
  getProjectMemberListApi,
  invitePrivateChannelApi,
  getChannelMemberListApi,
  kickChannelMemberApi,
  banChannelMemberApi,
  unbanChannelMemberApi,
  leaveProjectApi,
  banProjectMemberApi,
  unbanProjectMemberApi,
  patchServerRoleApi,
  getServerPermissionsApi,
  patchServerPermissionsApi,
  leaveChannelApi,
  deleteServerApi,
  deleteProjectApi,
  deleteChannelApi,
  updateProjectApi,
  updateChannelApi,
  getMyChannelsApi,
  updateLastChannelApi,
} from "../api/server.api";

export const useAddServerMutation = () => {
  return useMutation({
    mutationFn: (data: ServerRequest) => addServerApi(data),
    onSuccess: (data) => {
      console.log("🎉 서버 추가 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 추가 실패:", error);
    },
  });
};

export const useProjectListQuery = (serverUrl: string) => {
  return useQuery({
    queryKey: ["projectList", serverUrl],
    queryFn: () => getProjectListApi(serverUrl),
    enabled:
      !!serverUrl &&
      serverUrl.trim() !== "" &&
      serverUrl !== "DISABLED" &&
      serverUrl !== "null" &&
      serverUrl !== "undefined" &&
      !serverUrl.includes("undefined"),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useServerListQuery = (enabled: boolean = false) => {
  const { data: userInfo } = useGetUserInfoQuery();

  return useQuery({
    queryKey: ["serverList", userInfo?.userEmail],
    queryFn: () => getServerListApi(),
    enabled: userInfo?.userEmail ? enabled : false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useChannelListQuery = (serverUrl: string, projectPk: number) => {
  return useQuery({
    queryKey: ["channelList", serverUrl, projectPk],
    queryFn: () => getChannelListApi(serverUrl, projectPk),
    enabled: !!serverUrl && !serverUrl.includes("undefined") && !!projectPk,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useCreateChannelMutation = (serverUrl: string, projectPk: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelData: ChannelRequest) => createChannelApi(serverUrl, projectPk, channelData),
    onSuccess: (data) => {
      console.log("🎉 채널 생성 성공:", data);
      queryClient.invalidateQueries({ queryKey: ["channelList", serverUrl, projectPk] });
    },
    onError: (error) => {
      console.error("❌ 채널 생성 실패:", error);
    },
  });
};

export const useCreateProjectMutation = (serverUrl: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: { projectName: string; projectDescription?: string }) =>
      createProjectApi(serverUrl, projectData),
    onSuccess: (data) => {
      console.log("🎉 프로젝트 생성 성공:", data);
      queryClient.invalidateQueries({ queryKey: ["projectList", serverUrl] });
    },
    onError: (error) => {
      console.error("❌ 프로젝트 생성 실패:", error);
    },
  });
};

export const useServerAccessQuery = (serverUrl: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["serverAccess", serverUrl],
    queryFn: () => getServerAccessApi(serverUrl),
    enabled: !!serverUrl && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useServerJoinStatusQuery = (
  serverUrl: string,
  approvalStatus?: "Pending" | "Active" | "Inactive" | "Checking"
) => {
  return useQuery({
    queryKey: ["serverJoinStatus", serverUrl],
    queryFn: () => joinServerApi(serverUrl),
    enabled: !!serverUrl && approvalStatus !== "Active",
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    retry: false,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      if (approvalStatus === "Active") return false;
      return 5000;
    },
    refetchIntervalInBackground: false,
  });
};

export const usePatchServerAccessMutation = (serverUrl: string) => {
  return useMutation({
    mutationFn: ({ sStatus, userEmail }: { sStatus: ServerStatus; userEmail: string }) =>
      patchServerAccessApi(serverUrl, { sStatus, userEmail }),
    onSuccess: (data) => {
      console.log("🎉 서버 접근 권한 수정 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 접근 권한 수정 실패:", error);
    },
  });
};

export const useCreateInviteCodeMutation = (serverUrl: string) => {
  return useMutation({
    mutationFn: () => createInviteCodeApi(serverUrl),
    onSuccess: (data) => {
      console.log("🎉 초대 코드 생성 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 초대 코드 생성 실패:", error);
    },
  });
};

export const useUserMemberListQuery = (serverUrl: string) => {
  return useQuery({
    queryKey: ["memberList", serverUrl],
    queryFn: () => getServerMemberListApi(serverUrl),
    enabled: !!serverUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useInviteProjectMutation = (serverUrl: string, projectPk: number) => {
  return useMutation({
    mutationFn: (userEmails: string[]) => {
      const memberEmails = userEmails.map((userEmail) => ({ userEmail }));
      return inviteProjectApi(serverUrl, projectPk, memberEmails);
    },
    onSuccess: (data) => {
      console.log("🎉 프로젝트 초대 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 프로젝트 초대 실패:", error);
    },
  });
};

export const useProjectMemberListQuery = (serverUrl: string, projectPk: number) => {
  return useQuery({
    queryKey: ["projectMemberList", serverUrl, projectPk],
    queryFn: () => getProjectMemberListApi(serverUrl, projectPk),
    enabled: !!serverUrl && !!projectPk,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useLeaveProjectMutation = (serverUrl: string, projectPk: number) => {
  return useMutation({
    mutationFn: (userEmail: string) => leaveProjectApi(serverUrl, projectPk, { userEmail }),
  });
};

export const useBanProjectMemberMutation = (serverUrl: string, projectPk: number) => {
  return useMutation({
    mutationFn: (userEmail: string) => banProjectMemberApi(serverUrl, projectPk, { userEmail }),
  });
};

export const useUnbanProjectMemberMutation = (serverUrl: string, projectPk: number) => {
  return useMutation({
    mutationFn: (userEmail: string) => unbanProjectMemberApi(serverUrl, projectPk, { userEmail }),
  });
};

export const useInvitePrivateChannelMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useMutation({
    mutationFn: (userEmails: string[]) => {
      const memberEmails = userEmails.map((userEmail) => ({ userEmail }));
      return invitePrivateChannelApi(serverUrl, projectPk, channelPk, memberEmails);
    },
  });
};

export const useChannelMemberListQuery = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useQuery({
    queryKey: ["channelMemberList", serverUrl, projectPk, channelPk],
    queryFn: () => getChannelMemberListApi(serverUrl, projectPk, channelPk),
    enabled: !!serverUrl && !!projectPk && !!channelPk,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useLeaveChannelMutation = (serverUrl: string, projectPk: number, channelPk: number) => {
  return useMutation({
    mutationFn: (userEmail: string) => leaveChannelApi(serverUrl, projectPk, channelPk, { userEmail }),
  });
};

export const useKickChannelMemberMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useMutation({
    mutationFn: (userEmail: string) => kickChannelMemberApi(serverUrl, projectPk, channelPk, { userEmail }),
  });
};

export const useBanChannelMemberMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useMutation({
    mutationFn: (userEmail: string) => banChannelMemberApi(serverUrl, projectPk, channelPk, { userEmail }),
  });
};

export const useUnbanChannelMemberMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  return useMutation({
    mutationFn: (userEmail: string) =>
      unbanChannelMemberApi(serverUrl, projectPk, channelPk, { userEmail }),
  });
};

export const useServerRoleMutation = (serverUrl: string) => {
  return useMutation({
    mutationFn: (changes: RoleUsers) => patchServerRoleApi(serverUrl, changes),
  });
};

export const useServerRolePermessionQuery = (serverUrl: string) => {
  return useQuery({
    queryKey: ["serverRolePermession", serverUrl],
    queryFn: () => getServerPermissionsApi(serverUrl),
    enabled: !!serverUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePatchServerRolePermessionMutation = (serverUrl: string) => {
  return useMutation({
    mutationFn: (changePermission: ChangePermission) =>
      patchServerPermissionsApi(serverUrl, changePermission),
    onSuccess: (data) => {
      console.log("🎉 서버 권한 수정 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 권한 수정 실패:", error);
    },
  });
};

export const useMyChannelsQuery = () => {
  return useQuery({
    queryKey: ["myChannels"],
    queryFn: () => getMyChannelsApi(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useUpdateLastChannelMutation = () => {
  return useMutation({
    mutationFn: (channelPk: number) => updateLastChannelApi(channelPk),
    onSuccess: (data) => {
      console.log("🎉 마지막 채널 업데이트 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 마지막 채널 업데이트 실패:", error);
    },
  });
};

export const useDeleteServerMutation = (serverUrl: string) => {
  return useMutation({
    mutationFn: () => deleteServerApi(serverUrl),
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteProjectMutation = (serverUrl: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectPk: number) => deleteProjectApi(serverUrl, projectPk),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projectList", serverUrl] });
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteChannelMutation = (serverUrl: string, projectPk: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelPk: number) => deleteChannelApi(serverUrl, projectPk, channelPk),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["channelList", serverUrl] });
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useUpdateProjectMutation = (serverUrl: string, projectPk: number) => {
  return useMutation({
    mutationFn: (payload: ProjectPayload) => updateProjectApi(serverUrl, projectPk, payload),
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useUpdateChannelMutation = (serverUrl: string, projectPk: number, channelPk: number) => {
  return useMutation({
    mutationFn: (payload: ChannelPayload) => updateChannelApi(serverUrl, projectPk, channelPk, payload),
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
