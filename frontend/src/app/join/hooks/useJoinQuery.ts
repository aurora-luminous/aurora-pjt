import { useQuery } from "@tanstack/react-query"
import { useJoinApi } from "./useJoinApi"

export const useJoinQuery = (inviteHash: string, isLoggedIn: boolean = true) => {
    const { execute: getJoinQuery } = useJoinApi(inviteHash)
    return useQuery({
        queryKey: ["join", inviteHash],
        queryFn: () => getJoinQuery(),
        // 미로그인 상태에서는 실행 안 함
        enabled: !!inviteHash && isLoggedIn,
        staleTime: 0,    // 항상 최신 데이터 보장
        retry: 1,
    })
}