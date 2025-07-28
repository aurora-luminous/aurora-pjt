import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "../(server-setup)/hooks/useModal";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
