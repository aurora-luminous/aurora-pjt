import { expressClient } from "@/app/lib/axiosClient"
import { useApi } from "react-easy-api"
import { JoinRequest, JoinResponse } from "../types/ServerJoin"

export const useJoinApi = (inviteHash: string) => {
    return useApi<JoinResponse, JoinRequest>({
        endpoint: `/ex/servers/join/${inviteHash}`,
        method: "GET",
        axiosInstance: expressClient,
    })
}