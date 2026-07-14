import { expressClient } from "@/app/lib/axiosClient"
import { JoinResponse } from "../types/ServerJoin"

export const getJoinInfo = async (inviteHash: string) => expressClient.get<JoinResponse>(`/ex/servers/join/${inviteHash}`).then((res) => res.data);
