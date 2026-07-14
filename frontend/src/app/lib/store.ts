import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "../(server-setup)/hooks/useModal";
import voiceChannelReducer from "../(servers)/store/voiceChannelSlice";
import channelReducer from "../(servers)/store/channelSlice";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    voiceChannel: voiceChannelReducer,
    channels: channelReducer,
  },
  // Redux DevTools Extension 설정 (Redux Toolkit이 자동으로 처리)
  devTools: process.env.NODE_ENV !== "production" && {
    name: "Aurora Voice Channel Store",
    trace: true, // 액션 트레이스 활성화
    traceLimit: 25, // 트레이스 한계 설정
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
