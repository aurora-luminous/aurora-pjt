import { useQuery } from "@tanstack/react-query"
import { getJoinInfo } from "../api/join.api"

export const useJoinQuery = (inviteHash: string, isLoggedIn: boolean = true) => {
    return useQuery({
        queryKey: ["join", inviteHash],
        queryFn: () => getJoinInfo(inviteHash),
        // 미로그인 상태에서는 실행 안 함
        enabled: !!inviteHash && isLoggedIn,
        staleTime: 0,    // 항상 최신 데이터 보장
        retry: 1,
    })
}