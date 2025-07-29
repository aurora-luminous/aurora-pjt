import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "../(server-setup)/hooks/useModal";
import voiceChannelReducer from "../(servers)/store/voiceChannelSlice";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    voiceChannel: voiceChannelReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
