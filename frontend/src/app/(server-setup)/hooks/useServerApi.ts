import { useApi } from "react-easy-api"
import { ServerRequest, ServerResponse } from "../types/Server"
import { expressClient } from "@/app/lib/axiosClient"

export const useServerApi = () => {
    const {
        execute: addServerApi,
        loading: isAddingServer,
        error: addServerError,
    } = useApi<ServerResponse, ServerRequest>({
        endpoint: "/ex/servers",
        method: "POST",
        axiosInstance: expressClient
    })

    const addServer = async (data: ServerRequest): Promise<ServerResponse> => {
        try {
            console.log("서버 추가 시작:", data);
            const response = await addServerApi(data);

            return response || { message: "서버 추가 실패" };

        } catch (error) {
            console.error("서버 추가 실패:", error);
            throw error;
        }
    }

    return {
        addServer,
        isAddingServer,
        addServerError,
    }
}