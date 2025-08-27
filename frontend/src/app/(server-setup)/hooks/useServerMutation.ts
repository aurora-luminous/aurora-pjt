import { useServerApi } from "./useServerApi";
import { ServerRequest } from "../types/Server";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Channel } from "../types/Channel";
import { ServerStatus } from "@/app/(servers)/types/ServerAccess";

export const useAddServerMutation = () => {
  const { addServer } = useServerApi();

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

export const useGetProjectListMutation = () => {
  const { getProjectList } = useServerApi();

  return useMutation({
    mutationFn: async (serverUrl: string) => {
      const result = await getProjectList(serverUrl);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 프로젝트 목록 조회 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 프로젝트 목록 조회 실패:", error);
    },
  });
};

export const useGetServerListMutation = () => {
  const { getServerList } = useServerApi();

  return useMutation({
    mutationFn: async () => {
      const result = await getServerList();
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 서버 목록 조회 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 목록 조회 실패:", error);
    },
  });
};

export const useGetChannelListMutation = () => {
  const { getChannelList } = useServerApi();

  return useMutation({
    mutationFn: async ({
      serverUrl,
      projectPk,
    }: {
      serverUrl: string;
      projectPk: number;
    }) => {
      const result = await getChannelList(serverUrl, projectPk);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 채널 목록 조회 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 채널 목록 조회 실패:", error);
    },
  });
};

export const useCreateChannelMutation = () => {
  const { createChannel } = useServerApi();

  return useMutation({
    mutationFn: async ({
      serverUrl,
      projectPk,
      channelData,
    }: {
      serverUrl: string;
      projectPk: number;
      channelData: Omit<Channel, "channelName"> & { channelName?: string };
    }) => {
      const result = await createChannel(serverUrl, projectPk, channelData);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 채널 생성 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 채널 생성 실패:", error);
    },
  });
};

export const useCreateProjectMutation = () => {
  const { createProject } = useServerApi();

  return useMutation({
    mutationFn: async ({
      serverUrl,
      projectData,
    }: {
      serverUrl: string;
      projectData: {
        projectName: string;
        projectDescription?: string;
      };
    }) => {
      const result = await createProject(serverUrl, projectData);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 프로젝트 생성 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 프로젝트 생성 실패:", error);
    },
  });
};

// 🔄 Query: 서버 접근 권한 조회 (GET) - 관리자용
export const useServerAccessQuery = (serverUrl: string) => {
  const { getServerAccess } = useServerApi();

  return useQuery({
    queryKey: ["serverAccess", serverUrl],
    queryFn: () => getServerAccess(serverUrl),
    enabled: !!serverUrl, // serverUrl이 있을 때만 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};

// 🔄 Query: 사용자 본인의 서버 가입 상태 조회 (POST) - 승인 대기 페이지용
export const useServerJoinStatusQuery = (
  serverUrl: string,
  approvalStatus?: "pending" | "approved" | "rejected" | "checking"
) => {
  const { getServerJoinStatus } = useServerApi();

  return useQuery({
    queryKey: ["serverJoinStatus", serverUrl],
    queryFn: () => getServerJoinStatus(serverUrl),
    enabled: !!serverUrl && approvalStatus !== "approved", // serverUrl이 있고 승인되지 않았을 때만 실행
    staleTime: 0, // 항상 최신 데이터 확인
    gcTime: 1 * 60 * 1000, // 1분간 캐시 유지
    refetchInterval: 5000, // 5초마다 자동 refetch
    refetchIntervalInBackground: false, // 백그라운드에서는 refetch 안함
  });
};

// ⚠️ 하위 호환성을 위해 유지 (deprecated)
export const useServerStatusMutation = () => {
  const { getServerAccess } = useServerApi();

  return useMutation({
    mutationFn: async ({ serverUrl }: { serverUrl: string }) => {
      const result = await getServerAccess(serverUrl);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 서버 접근 권한 조회 성공:", data);
    },
    onError: (error) => {
      console.error("❌ 서버 접근 권한 조회 실패:", error);
    },
  });
};

// ✅ Mutation: 서버 접근 권한 수정 (PATCH)
export const usePatchServerAccessMutation = () => {
  const { patchServerAccess } = useServerApi();

  return useMutation({
    mutationFn: async ({
      serverUrl,
      status,
      serverMemberPk,
    }: {
      serverUrl: string;
      status: ServerStatus;
      serverMemberPk: number;
    }) => {
      const result = await patchServerAccess(serverUrl, status, serverMemberPk);
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
