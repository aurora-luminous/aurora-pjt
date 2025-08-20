import { useServerApi } from "./useServerApi";
import { ServerRequest } from "../types/Server";
import { useMutation } from "@tanstack/react-query";
import { Channel } from "../types/Channel";

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
