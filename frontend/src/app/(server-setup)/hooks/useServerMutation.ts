import { ServerRequest, ChangePermission } from "../types/Server";
import { RoleUsers } from "../types/Server";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChannelRequest } from "../types/Channel";
import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";
import { ServerStatus } from "@/app/(servers)/types/ServerAccess";
import {
  useAddServerApi,
  useServerListApi,
  useProjectListApi,
  useChannelListApi,
  useCreateChannelApi,
  useCreateProjectApi,
  useServerAccessApi,
  useServerJoinStatusApi,
  usePatchServerAccessApi,
  useCreateInviteCodeApi,
  useUserMemberListApi,
  useInviteProjectApi,
  useProjectMemberListApi,
  useInvitePrivateChannelApi,
  useChannelMemberListApi,
  useKickChannelMemberApi,
  useBanChannelMemberApi,
  useUnbanChannelMemberApi,
  useLeaveProjectApi,
  useBanProjectMemberApi,
  useUnbanProjectMemberApi,
  useServerRoleApi,
  useServerPermessionApi,
  usePatchServerPermessionApi,
  useLeaveChannelApi,
  useServerDeleteApi,
  useProjectDeleteApi,
  useChannelDeleteApi,
} from "./useServerApi";

export const useAddServerMutation = () => {
  const { execute: addServer } = useAddServerApi();

  return useMutation({
    mutationFn: async (data: ServerRequest) => {
      const result = await addServer(data);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 서버 추가 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 추가 실패:", error);
    },
  });
};

// 🔄 Query: 프로젝트 목록 조회 (GET)
export const useProjectListQuery = (serverUrl: string) => {
  const { execute: getProjectList } = useProjectListApi(serverUrl);

  return useQuery({
    queryKey: ["projectList", serverUrl],
    queryFn: () => getProjectList(),
    enabled:
      !!serverUrl &&
      serverUrl.trim() !== "" &&
      serverUrl !== "DISABLED" &&
      serverUrl !== "null" &&
      serverUrl !== "undefined" &&
      !serverUrl.includes("undefined"),
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};

// 🔄 Query: 서버 목록 조회 (GET)
export const useServerListQuery = (enabled: boolean = false) => {
  const { data: userInfo } = useGetUserInfoQuery();
  const { execute: getServerList } = useServerListApi();

  return useQuery({
    queryKey: ["serverList", userInfo?.userEmail],
    queryFn: async () => {
      const result = await getServerList();
      return result;
    },
    enabled: userInfo?.userEmail ? enabled : false, // 명시적으로 enabled가 true일 때만 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};

// 🔄 Query: 채널 목록 조회 (GET)
export const useChannelListQuery = (serverUrl: string, projectPk: number) => {
  const { execute: getChannelList } = useChannelListApi(serverUrl, projectPk);

  return useQuery({
    queryKey: ["channelList", serverUrl, projectPk],
    queryFn: () => getChannelList(),
    enabled: !!serverUrl && !serverUrl.includes("undefined") && !!projectPk,
    staleTime: 2 * 60 * 1000, // 2분간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
};

export const useCreateChannelMutation = (
  serverUrl: string,
  projectPk: number
) => {
  const { execute: createChannel } = useCreateChannelApi(serverUrl, projectPk);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      channelData: ChannelRequest
    ) => {
      const result = await createChannel(channelData);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 채널 생성 성공:", data);
      // 채널 목록 쿼리 무효화하여 즉시 반영
      queryClient.invalidateQueries({
        queryKey: ["channelList", serverUrl, projectPk],
      });
    },
    onError: (error) => {
      console.error("❌ 채널 생성 실패:", error);
    },
  });
};

export const useCreateProjectMutation = (serverUrl: string) => {
  const { execute: createProject } = useCreateProjectApi(serverUrl);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: {
      projectName: string;
      projectDescription?: string;
    }) => {
      const result = await createProject(projectData);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 프로젝트 생성 성공:", data);
      // 프로젝트 목록 쿼리 무효화하여 즉시 반영
      queryClient.invalidateQueries({
        queryKey: ["projectList", serverUrl],
      });
    },
    onError: (error) => {
      console.error("❌ 프로젝트 생성 실패:", error);
    },
  });
};

// 🔄 Query: 서버 접근 권한 조회 (GET) - 관리자용
export const useServerAccessQuery = (
  serverUrl: string,
  options?: { enabled?: boolean }
) => {
  const { execute: getServerAccess } = useServerAccessApi(serverUrl);

  return useQuery({
    queryKey: ["serverAccess", serverUrl],
    queryFn: () => getServerAccess(),
    enabled: !!serverUrl && options?.enabled !== false, // serverUrl이 있고 enabled가 false가 아닐 때만 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};

// 🔄 Query: 사용자 본인의 서버 가입 상태 조회 (POST) - 승인 대기 페이지용
export const useServerJoinStatusQuery = (
  serverUrl: string,
  approvalStatus?: "Pending" | "Active" | "Inactive" | "Checking"
) => {
  const { execute: getServerJoinStatus } = useServerJoinStatusApi(serverUrl);

  return useQuery({
    queryKey: ["serverJoinStatus", serverUrl],
    queryFn: () => getServerJoinStatus(),
    enabled: !!serverUrl && approvalStatus !== "Active", // serverUrl이 있고 승인되지 않았을 때만 실행
    staleTime: 0, // 항상 최신 데이터 확인
    gcTime: 1 * 60 * 1000, // 1분간 캐시 유지
    refetchInterval: 5000, // 5초마다 자동 refetch
    refetchIntervalInBackground: false, // 백그라운드에서는 refetch 안함
  });
};

// ✅ Mutation: 서버 접근 권한 수정 (PATCH)
export const usePatchServerAccessMutation = (serverUrl: string) => {
  const { execute: patchServerAccess } = usePatchServerAccessApi(serverUrl);

  return useMutation({
    mutationFn: async ({
      sStatus,
      userEmail,
    }: {
      sStatus: ServerStatus;
      userEmail: string;
    }) => {
      const result = await patchServerAccess({ sStatus, userEmail });
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 서버 접근 권한 수정 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 접근 권한 수정 실패:", error);
    },
  });
};

// ✅ Mutation: 초대 코드 생성
export const useCreateInviteCodeMutation = (serverUrl: string) => {
  const { execute: createInviteCode } = useCreateInviteCodeApi(serverUrl);

  return useMutation({
    mutationFn: async () => {
      const result = await createInviteCode();
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 초대 코드 생성 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 초대 코드 생성 실패:", error);
    },
  });
};

export const useUserMemberListQuery = (serverUrl: string) => {
  const { execute: getMemberList } = useUserMemberListApi(serverUrl);

  return useQuery({
    queryKey: ["memberList", serverUrl],
    queryFn: () => getMemberList(),
    enabled: !!serverUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useInviteProjectMutation = (
  serverUrl: string,
  projectPk: number
) => {
  const { execute: inviteProject } = useInviteProjectApi(serverUrl, projectPk);

  return useMutation({
    mutationFn: async (userEmails: string[]) => {
      const memberEmails = userEmails.map((userEmail) => ({ userEmail }));
      const result = await inviteProject(memberEmails);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 프로젝트 초대 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 프로젝트 초대 실패:", error);
    },
  });
};

export const useProjectMemberListQuery = (
  serverUrl: string,
  projectPk: number
) => {
  const { execute: getProjectMemberList } = useProjectMemberListApi(
    serverUrl,
    projectPk
  );

  return useQuery({
    queryKey: ["projectMemberList", serverUrl, projectPk],
    queryFn: () => getProjectMemberList(),
    enabled: !!serverUrl && !!projectPk,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useLeaveProjectMutation = (
  serverUrl: string,
  projectPk: number
) => {
  const { execute: leaveProject } = useLeaveProjectApi(serverUrl, projectPk);

  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await leaveProject({ userEmail });
      return result;
    },
  });
};

export const useBanProjectMemberMutation = (
  serverUrl: string,
  projectPk: number
) => {
  const { execute: banProjectMember } = useBanProjectMemberApi(
    serverUrl,
    projectPk
  );
  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await banProjectMember({ userEmail });
      return result;
    },
  });
};

export const useUnbanProjectMemberMutation = (
  serverUrl: string,
  projectPk: number
) => {
  const { execute: unbanProjectMember } = useUnbanProjectMemberApi(
    serverUrl,
    projectPk
  );

  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await unbanProjectMember({ userEmail });
      return result;
    },
  });
};

export const useInvitePrivateChannelMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const { execute: invitePrivateChannel } = useInvitePrivateChannelApi(
    serverUrl,
    projectPk,
    channelPk
  );

  return useMutation({
    mutationFn: async (userEmails: string[]) => {
      const memberEmails = userEmails.map((userEmail) => ({ userEmail }));
      const result = await invitePrivateChannel(memberEmails);
      return result;
    },
  });
};

export const useChannelMemberListQuery = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const { execute: getChannelMemberList } = useChannelMemberListApi(
    serverUrl,
    projectPk,
    channelPk
  );

  return useQuery({
    queryKey: ["channelMemberList", serverUrl, projectPk, channelPk],
    queryFn: () => getChannelMemberList(),
    enabled: !!serverUrl && !!projectPk && !!channelPk,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useLeaveChannelMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const { execute: leaveChannel } = useLeaveChannelApi(
    serverUrl,
    projectPk,
    channelPk
  );

  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await leaveChannel({ userEmail });
      return result;
    },
  });
};

// // 사이드바 등 목록에서 여러 채널을 나갈 때 사용하는 유동적 뮤테이션
// export const useLeaveChannelDynamicMutation = (
//   serverUrl: string,
//   projectPk: number
// ) => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       channelPk,
//       userEmail,
//     }: {
//       channelPk: number;
//       userEmail: string;
//     }) => {
//       const response = await expressClient.patch(
//         `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/members/remove`,
//         { userEmail }
//       );
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["channelList", serverUrl, projectPk],
//       });
//     },
//   });
// };

export const useKickChannelMemberMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const { execute: kickChannelMember } = useKickChannelMemberApi(
    serverUrl,
    projectPk,
    channelPk
  );

  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await kickChannelMember({ userEmail });
      return result;
    },
  });
};

export const useBanChannelMemberMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const { execute: banChannelMember } = useBanChannelMemberApi(
    serverUrl,
    projectPk,
    channelPk
  );

  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await banChannelMember({ userEmail });
      return result;
    },
  });
};

export const useUnbanChannelMemberMutation = (
  serverUrl: string,
  projectPk: number,
  channelPk: number
) => {
  const { execute: unbanChannelMember } = useUnbanChannelMemberApi(
    serverUrl,
    projectPk,
    channelPk
  );

  return useMutation({
    mutationFn: async (userEmail: string) => {
      const result = await unbanChannelMember({ userEmail });
      return result;
    },
  });
};



export const useServerRoleMutation = (serverUrl: string) => {
  const { execute: patchServerRole } = useServerRoleApi(serverUrl);

  return useMutation({
    mutationFn: async (changes: RoleUsers) => {
      const result = await patchServerRole(changes);
      return result;
    },
  });
};

export const useServerRolePermessionQuery = (serverUrl: string) => {
  const { execute: getServerRolePermession } =
    useServerPermessionApi(serverUrl);
  return useQuery({
    queryKey: ["serverRolePermession", serverUrl],
    queryFn: () => getServerRolePermession(),
    enabled: !!serverUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePatchServerRolePermessionMutation = (serverUrl: string) => {
  const { execute: patchServerRolePermession } =
    usePatchServerPermessionApi(serverUrl);
  return useMutation({
    mutationFn: async (changePermission: ChangePermission) => {
      const result = await patchServerRolePermession(changePermission);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 서버 권한 수정 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 권한 수정 실패:", error);
    },
  });
};

export const useDeleteServerMutation = (serverUrl: string) => {
  const {execute: deleteServer} = useServerDeleteApi(serverUrl);
  return useMutation({
    mutationFn: async () => {
      const result = await deleteServer();
      return result;
    },
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    }
  });
}

export const useDeleteProjectMutation = (serverUrl: string) => {
  const queryClient = useQueryClient();

  const {execute: deleteProject} = useProjectDeleteApi(serverUrl);
  return useMutation({
    mutationFn: async (projectPk: number) => {
      const result = await deleteProject(undefined, {url: `/ex/servers/${serverUrl}/projects/${projectPk}/delete`});
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projectList", serverUrl],
      });
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    }
  })
}

export const useDeleteChannelMutation = (serverUrl: string, projectPk: number) => {
  const queryClient = useQueryClient();

  const {execute: deleteChannel} = useChannelDeleteApi(serverUrl, projectPk);
  return useMutation({
    mutationFn: async (channelPk: number) => {
      const result = await deleteChannel(undefined, {url: `/ex/servers/${serverUrl}/projects/${projectPk}/channels/${channelPk}/delete`});
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["channelList", serverUrl],
      });
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
    }
  })
}