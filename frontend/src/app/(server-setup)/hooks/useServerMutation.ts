import { useServerApi } from "./useServerApi";
import { ServerRequest } from "../types/Server";
import { useMutation } from "@tanstack/react-query";

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
