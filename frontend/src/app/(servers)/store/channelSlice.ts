import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Channel } from "@/app/(server-setup)/types/Channel";

interface ChannelState {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  currentProjectPk: number | null; // 현재 프로젝트 구분
  currentServerUrl: string | null; // 현재 서버 구분
}

const initialState: ChannelState = {
  channels: [],
  loading: false,
  error: null,
  lastUpdated: null,
  currentProjectPk: null,
  currentServerUrl: null,
};

const channelSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setChannels: (
      state,
      action: PayloadAction<{
        channels: Channel[];
        projectPk: number;
        serverUrl: string;
      }>
    ) => {
      const { channels, projectPk, serverUrl } = action.payload;

      // 새로운 채널 목록으로 설정
      state.channels = channels;
      state.currentProjectPk = projectPk;
      state.currentServerUrl = serverUrl;
      state.loading = false;
      state.error = null;
      state.lastUpdated = Date.now();
    },
    addChannel: (state, action: PayloadAction<Channel>) => {
      // 현재 프로젝트에만 채널 추가
      console.log(
        `➕ [Redux] 채널 추가 (프로젝트 ${state.currentProjectPk}):`,
        action.payload.channelName
      );
      state.channels.push(action.payload);
      state.lastUpdated = Date.now();
    },
    removeChannel: (state, action: PayloadAction<number>) => {
      console.log(
        `➖ [Redux] 채널 제거 (프로젝트 ${state.currentProjectPk}):`,
        action.payload
      );
      state.channels = state.channels.filter(
        (channel) => channel.channelPk !== action.payload
      );
      state.lastUpdated = Date.now();
    },
    updateChannel: (state, action: PayloadAction<Channel>) => {
      const index = state.channels.findIndex(
        (channel) => channel.channelPk === action.payload.channelPk
      );
      if (index !== -1) {
        console.log(
          `🔄 [Redux] 채널 업데이트 (프로젝트 ${state.currentProjectPk}):`,
          action.payload.channelName
        );
        state.channels[index] = action.payload;
        state.lastUpdated = Date.now();
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearChannels: (state) => {
      console.log(
        `🗑️ [Redux] 채널 목록 초기화 (프로젝트 정보 유지: ${state.currentProjectPk})`
      );
      state.channels = [];
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
      // 프로젝트 정보는 유지하여 다음 로드 시 비교 가능
    },
    // 프로젝트 변경 시 완전 초기화
    resetChannelState: (state) => {
      console.log(
        `🔄 [Redux] 채널 상태 완전 초기화 (이전 프로젝트: ${state.currentProjectPk})`
      );
      state.channels = [];
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
      state.currentProjectPk = null;
      state.currentServerUrl = null;
    },
  },
});

export const {
  setLoading,
  setChannels,
  addChannel,
  removeChannel,
  updateChannel,
  setError,
  clearChannels,
  resetChannelState,
} = channelSlice.actions;

export default channelSlice.reducer;
