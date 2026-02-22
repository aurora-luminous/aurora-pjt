import { useQuery } from "@tanstack/react-query"
import { useJoinApi } from "./useJoinApi"

export const useJoinQuery = (inviteHash: string) => {
    const {execute: getJoinQuery} = useJoinApi(inviteHash)
    return useQuery({
        queryKey: ["join", inviteHash],
        queryFn: () => getJoinQuery(),
        enabled: !!inviteHash,
    })
}