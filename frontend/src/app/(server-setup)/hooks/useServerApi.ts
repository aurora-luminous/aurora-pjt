import { useApi } from "react-easy-api";
import { ServerRequest, ServerResponse } from "../types/Server";
import { expressClient } from "@/app/lib/axiosClient";
import { Project } from "../types/Projcets";
import { useState, useCallback } from "react";
import { Channel } from "../types/Channel";

// 프로젝트 목록 조회 전용 훅
export const useProjectListApi = (serverUrl: string) => {
  return useApi<Project[], void>({
    endpoint: `/ex/servers/${serverUrl}/projects`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

export const useSeverListApi = (serverUrl: string, projectPk: number) => {
  return useApi<Project[], void>({
    endpoint: `/ex/servers/${serverUrl}/projects/${projectPk}/servers`,
    method: "GET",
    axiosInstance: expressClient,
  });
};

export const useServerApi = () => {
  const {
    execute: addServerApi,
    loading: isAddingServer,
    error: addServerError,
  } = useApi<ServerResponse, ServerRequest>({
    endpoint: "/ex/servers",
    method: "POST",
    axiosInstance: expressClient,
  });

  const [projectListLoading, setProjectListLoading] = useState(false);
  const [projectListError, setProjectListError] = useState<Error | null>(null);

  const addServer = async (data: ServerRequest): Promise<ServerResponse> => {
    try {
      console.log("서버 추가 시작:", data);
      const response = await addServerApi(data);

      return response || { message: "" };
    } catch (error) {
      console.error("서버 추가 실패:", error);
      throw error;
    }
  };

  // useCallback으로 메모화하여 불필요한 재생성 방지
  const getProjectList = useCallback(
    async (serverUrl: string): Promise<Project[]> => {
      setProjectListLoading(true);
      setProjectListError(null);

      try {
        console.log("프로젝트 목록 조회 시작:", serverUrl);

        const response = await expressClient.get<Project[]>(
          `/ex/servers/${serverUrl}/projects`
        );

        setProjectListLoading(false);
        return response.data || [];
      } catch (error) {
        console.error("프로젝트 목록 조회 실패:", error);
        setProjectListError(error as Error);
        setProjectListLoading(false);
        throw error;
      }
    },
    []
  );

  const getChannelList = useCallback(
    async (serverUrl: string, projectPk: number): Promise<Channel[]> => {
      try {
        const response = await expressClient.get<Channel[]>(
          `/ex/servers/${serverUrl}/projects/${projectPk}/channels`
        );
        return response.data || [];
      } catch (error) {
        console.error("채널 목록 조회 실패:", error);
        throw error;
      }
    },
    []
  );

  const createChannel = useCallback(
    async (
      serverUrl: string,
      projectPk: number,
      channelData: Omit<Channel, "channelName"> & { channelName?: string }
    ): Promise<Channel> => {
      try {
        console.log("채널 생성 시작:", { serverUrl, projectPk, channelData });

        const defaultChannelData = {
          ...channelData,
          channelName: channelData.channelName || "general",
        };

        const response = await expressClient.post<Channel>(
          `/ex/servers/${serverUrl}/projects/${projectPk}/channels`,
          defaultChannelData
        );

        console.log("✅ 채널 생성 성공:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ 채널 생성 실패:", error);
        throw error;
      }
    },
    []
  );

  return {
    addServer,
    isAddingServer,
    addServerError,
    getProjectList,
    isGettingProjectList: projectListLoading,
    getProjectListError: projectListError,
    getChannelList,
    createChannel,
  };
};
