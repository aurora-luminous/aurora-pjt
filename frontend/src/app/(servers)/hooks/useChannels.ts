import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
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
import {
  useChannelListQuery,
  useCreateChannelMutation,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { expressClient } from "@/app/lib/axiosClient";
import React from "react";

export const useChannels = (serverUrl?: string, projectPk?: number) => {
  const dispatch = useDispatch<AppDispatch>();
  const channelState = useSelector((state: RootState) => state.channels);

  // 항상 훅을 호출하되, 파라미터가 있을 때만 유효
  const channelListQuery = useChannelListQuery(serverUrl || "", projectPk || 0);
  const createChannelMutation = useCreateChannelMutation(
    serverUrl || "",
    projectPk || 0
  );

  // 유효한 파라미터가 있는지 확인
  const hasValidParams = !!(serverUrl && projectPk);

  // 실행 중인 요청 방지를 위한 ref
  const loadingRef = React.useRef<{
    serverUrl: string;
    projectPk: number;
  } | null>(null);

  // 채널 목록 로드 - 빈 채널일 때 자동 생성
  const loadChannels = useCallback(
    async (targetServerUrl?: string, targetProjectPk?: number) => {
      // 파라미터가 전달되면 사용하고, 아니면 훅 초기화 시 받은 값 사용
      const finalServerUrl = targetServerUrl || serverUrl;
      const finalProjectPk = targetProjectPk || projectPk;

      if (!finalServerUrl || !finalProjectPk) {
        console.error("❌ 서버 URL과 프로젝트 PK가 필요합니다.");
        return;
      }

      // 이미 같은 요청이 진행 중인지 확인
      if (
        loadingRef.current &&
        loadingRef.current.serverUrl === finalServerUrl &&
        loadingRef.current.projectPk === finalProjectPk
      ) {
        console.log("🔄 동일한 요청이 이미 진행 중이므로 건너뜀");
        return;
      }

      // 현재 Redux 상태 직접 가져오기
      const currentState = channelState;

      // 프로젝트가 변경되었는지 먼저 확인
      const isProjectChanged =
        currentState.currentProjectPk !== null &&
        currentState.currentServerUrl !== null &&
        (currentState.currentProjectPk !== finalProjectPk ||
          currentState.currentServerUrl !== finalServerUrl);

      if (isProjectChanged) {
        console.log(
          `🔄 프로젝트 변경: ${currentState.currentProjectPk} → ${finalProjectPk}`
        );
        dispatch(clearChannels());
      }

      // 프로젝트 변경 후에 이미 같은 프로젝트의 채널이 로드되어 있는지 확인
      const updatedState = channelState;
      if (
        !isProjectChanged &&
        updatedState.currentProjectPk === finalProjectPk &&
        updatedState.currentServerUrl === finalServerUrl &&
        updatedState.channels.length > 0 &&
        !updatedState.loading
      ) {
        console.log(`✅ 프로젝트 ${finalProjectPk}의 채널이 이미 로드됨`);
        return updatedState.channels;
      }

      try {
        // 요청 시작 표시
        loadingRef.current = {
          serverUrl: finalServerUrl,
          projectPk: finalProjectPk,
        };
        dispatch(setLoading(true));

        // 직접 API 호출로 채널 목록 조회 (React Query 캐싱 문제 해결)
        console.log(`📡 프로젝트 ${finalProjectPk} 채널 목록 조회`);
        const response = await expressClient.get(
          `/ex/servers/${finalServerUrl}/projects/${finalProjectPk}/channels`
        );
        const channelList = response.data || [];

        // Redux에 채널 저장
        dispatch(
          setChannels({
            channels: channelList,
            projectPk: finalProjectPk,
            serverUrl: finalServerUrl,
          })
        );

        console.log(
          `✅ 프로젝트 ${finalProjectPk} 채널 로드 완료 (${channelList.length}개)`
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
      } finally {
        // 요청 완료 표시
        loadingRef.current = null;
        dispatch(setLoading(false));
      }
    },
    [
      dispatch,
      // channelState를 dependency에서 제거하여 무한 루프 방지
    ]
  );

  // 새 채널 추가 (현재 프로젝트에만)
  const addChannelToState = useCallback(
    (channel: Channel) => {
      console.log(`➕ Redux에 새 채널 추가:`, channel);
      dispatch(addChannelAction(channel));
    },
    [dispatch]
  );

  // 채널 제거 (현재 프로젝트에서만)
  const removeChannelFromState = useCallback(
    (channelName: string) => {
      console.log(`➖ Redux에서 채널 제거: ${channelName}`);
      dispatch(removeChannelAction(channelName));
    },
    [dispatch]
  );

  // 채널 업데이트 (현재 프로젝트에서만)
  const updateChannelInState = useCallback(
    (channel: Channel) => {
      console.log(`🔄 Redux에서 채널 업데이트:`, channel);
      dispatch(updateChannelAction(channel));
    },
    [dispatch]
  );

  // 채널 목록 초기화
  const clearChannelList = useCallback(() => {
    dispatch(clearChannels());
  }, [dispatch]);

  // 채널 상태 리셋
  const resetChannels = useCallback(() => {
    dispatch(resetChannelState());
  }, [dispatch]);

  // 필터링된 채널들 - useMemo로 변경
  const textChannels = useMemo(
    () => channelState.channels.filter((c) => c.channelKind === "text"),
    [channelState.channels]
  );

  const voiceChannels = useMemo(
    () => channelState.channels.filter((c) => c.channelKind === "voice"),
    [channelState.channels]
  );

  const noticeChannels = useMemo(
    () => channelState.channels.filter((c) => c.channelKind === "notice"),
    [channelState.channels]
  );

  // 채널 종류별 필터링 - useMemo로 변경
  const getChannelsByType = useMemo(
    () => (channelKind: string) => {
      if (channelKind === "text") return textChannels;
      if (channelKind === "voice") return voiceChannels;
      if (channelKind === "notice") return noticeChannels;
      return channelState.channels.filter((c) => c.channelKind === channelKind);
    },
    [textChannels, voiceChannels, noticeChannels, channelState.channels]
  );

  // 특정 채널 찾기 - useMemo로 변경
  const findChannel = useMemo(
    () => (channelName: string) => {
      return channelState.channels.find((c) => c.channelName === channelName);
    },
    [channelState.channels]
  );

  // 현재 프로젝트인지 확인 - useCallback은 유지 (간단한 비교)
  const isCurrentProject = useCallback(
    (projectPk?: number, serverUrl?: string) => {
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
    textChannels,
    voiceChannels,
    noticeChannels,

    // query 상태 (유효한 파라미터가 있을 때만)
    isLoadingChannelList: hasValidParams ? channelListQuery.isLoading : false,
    isCreatingChannel: hasValidParams ? createChannelMutation.isPending : false,
    channelListError: hasValidParams ? channelListQuery.error : null,
    createChannelError: hasValidParams ? createChannelMutation.error : null,
  };
};
