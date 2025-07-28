import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../lib/store";

// 모달 타입 정의
export type ModalType = "SERVER_ADD" | "SERVER_EDIT" | "SERVER_DELETE" | null;

// 서버 데이터 타입 정의
export interface ServerData {
  id?: string;
  name: string;
  url: string;
  description?: string;
}

// 모달 상태 인터페이스
export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data: ServerData | null;
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: ModalState = {
  isOpen: false,
  type: null,
  data: null,
  loading: false,
  error: null,
};

// 모달 슬라이스 생성
const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    // 모달 열기
    openModal: (
      state,
      action: PayloadAction<{ type: ModalType; data?: ServerData }>
    ) => {
      state.isOpen = true;
      state.type = action.payload.type;
      state.data = action.payload.data || null;
      state.error = null;
    },

    // 모달 닫기
    closeModal: (state) => {
      state.isOpen = false;
      state.type = null;
      state.data = null;
      state.error = null;
      state.loading = false;
    },

    // 모달 데이터 업데이트
    updateModalData: (state, action: PayloadAction<ServerData>) => {
      state.data = action.payload;
    },

    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // 에러 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
  },
});

// 액션 내보내기
export const {
  openModal,
  closeModal,
  updateModalData,
  setLoading,
  setError,
  clearError,
} = modalSlice.actions;

// 리듀서 내보내기
export default modalSlice.reducer;

// 커스텀 훅
export const useModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const modalState = useSelector((state: RootState) => state.modal);

  const actions = {
    // 서버 추가 모달 열기
    openServerAddModal: () => {
      dispatch(openModal({ type: "SERVER_ADD" }));
    },

    // 서버 편집 모달 열기
    openServerEditModal: (serverData: ServerData) => {
      dispatch(openModal({ type: "SERVER_EDIT", data: serverData }));
    },

    // 서버 삭제 모달 열기
    openServerDeleteModal: (serverData: ServerData) => {
      dispatch(openModal({ type: "SERVER_DELETE", data: serverData }));
    },

    // 모달 닫기
    close: () => {
      dispatch(closeModal());
    },

    // 모달 데이터 업데이트
    updateData: (data: ServerData) => {
      dispatch(updateModalData(data));
    },

    // 로딩 시작
    startLoading: () => {
      dispatch(setLoading(true));
    },

    // 로딩 종료
    stopLoading: () => {
      dispatch(setLoading(false));
    },

    // 에러 설정
    setError: (error: string) => {
      dispatch(setError(error));
    },

    // 에러 초기화
    clearError: () => {
      dispatch(clearError());
    },
  };

  return {
    // 상태
    isOpen: modalState.isOpen,
    type: modalState.type,
    data: modalState.data,
    loading: modalState.loading,
    error: modalState.error,

    // 액션들
    ...actions,

    // 유틸리티 메서드
    isServerAddModal: modalState.type === "SERVER_ADD",
    isServerEditModal: modalState.type === "SERVER_EDIT",
    isServerDeleteModal: modalState.type === "SERVER_DELETE",
  };
};
