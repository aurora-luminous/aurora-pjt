import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import type { RootState, AppDispatch } from "../../lib/store";
import {
  setLoading,
  setChannels,
  addChannel as addChannelAction,
  removeChannel as removeChannelAction,
  updateChannel as updateChannelAction,
  setError,
  clearChannels,
  resetChannelState,
} from "../store/channelSlice";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { useServerApi } from "@/app/(server-setup)/hooks/useServerApi";

export const useChannels = () => {
  const dispatch = useDispatch<AppDispatch>();
  const channelState = useSelector((state: RootState) => state.channels);
  const { getChannelList, createChannel } = useServerApi();

  // 채널 목록 로드 - 빈 채널일 때 자동 생성
  const loadChannels = useCallback(
    async (serverUrl: string, projectPk: number) => {
      dispatch(setLoading(true));
      try {
        let channelList = await getChannelList(serverUrl, projectPk);

        // 채널이 없으면 자동으로 "general" 채널 생성
        if (!channelList || channelList.length === 0) {
          console.log("📋 채널이 없어서 기본 'general' 채널 생성 중...");

          const newChannel = await createChannel(serverUrl, projectPk, {
            channelKind: "text",
            isPrivate: false,
            channelRole: "member",
          });

          console.log("✅ 기본 채널 생성 완료:", newChannel);
          channelList = [newChannel];
        }

        dispatch(
          setChannels({
            channels: channelList,
            projectPk,
            serverUrl,
          })
        );

        return channelList;
      } catch (error) {
        console.error("❌ 채널 목록 로드 실패:", error);
        dispatch(
          setError(
            error instanceof Error ? error.message : "채널 목록 로드 실패"
          )
        );
        throw error;
      }
    },
    [dispatch, getChannelList, createChannel]
  );

  // 새 채널 추가 (현재 프로젝트에만)
  const addChannelToState = useCallback(
    (channel: Channel) => {
      console.log(
        `➕ Redux에 새 채널 추가 (프로젝트 ${channelState.currentProjectPk}):`,
        channel
      );
      dispatch(addChannelAction(channel));
    },
    [dispatch, channelState.currentProjectPk]
  );

  // 채널 제거 (현재 프로젝트에서만)
  const removeChannelFromState = useCallback(
    (channelName: string) => {
      console.log(
        `➖ Redux에서 채널 제거 (프로젝트 ${channelState.currentProjectPk}): ${channelName}`
      );
      dispatch(removeChannelAction(channelName));
    },
    [dispatch, channelState.currentProjectPk]
  );

  // 채널 업데이트 (현재 프로젝트에서만)
  const updateChannelInState = useCallback(
    (channel: Channel) => {
      console.log(
        `🔄 Redux에서 채널 업데이트 (프로젝트 ${channelState.currentProjectPk}):`,
        channel
      );
      dispatch(updateChannelAction(channel));
    },
    [dispatch, channelState.currentProjectPk]
  );

  // 채널 목록 초기화 (현재 프로젝트 유지)
  const clearChannelList = useCallback(() => {
    console.log(`🗑️ Redux 채널 목록 초기화 (프로젝트 정보 유지)`);
    dispatch(clearChannels());
  }, [dispatch]);

  // 프로젝트 변경 시 완전 초기화
  const resetChannels = useCallback(() => {
    console.log(`🔄 Redux 채널 상태 완전 초기화`);
    dispatch(resetChannelState());
  }, [dispatch]);

  // 채널 타입별 필터링 (현재 프로젝트의 채널만)
  const getChannelsByType = useCallback(
    (channelKind?: string) => {
      if (!channelKind) {
        return channelState.channels.filter(
          (c) => c.channelKind === "text" || !c.channelKind
        );
      }
      return channelState.channels.filter((c) => c.channelKind === channelKind);
    },
    [channelState.channels]
  );

  // 특정 채널 찾기 (현재 프로젝트에서만)
  const findChannel = useCallback(
    (channelName: string) => {
      return channelState.channels.find((c) => c.channelName === channelName);
    },
    [channelState.channels]
  );

  // 현재 프로젝트 확인
  const isCurrentProject = useCallback(
    (projectPk: number, serverUrl: string) => {
      return (
        channelState.currentProjectPk === projectPk &&
        channelState.currentServerUrl === serverUrl
      );
    },
    [channelState.currentProjectPk, channelState.currentServerUrl]
  );

  return {
    // 상태
    channels: channelState.channels,
    loading: channelState.loading,
    error: channelState.error,
    lastUpdated: channelState.lastUpdated,
    currentProjectPk: channelState.currentProjectPk,
    currentServerUrl: channelState.currentServerUrl,

    // 액션
    loadChannels,
    addChannelToState,
    removeChannelFromState,
    updateChannelInState,
    clearChannelList,
    resetChannels,

    // 유틸리티
    getChannelsByType,
    findChannel,
    isCurrentProject,

    // 필터링된 채널들 (현재 프로젝트의 채널만)
    textChannels: getChannelsByType("text"),
    voiceChannels: getChannelsByType("voice"),
    noticeChannels: getChannelsByType("notice"),
  };
};
