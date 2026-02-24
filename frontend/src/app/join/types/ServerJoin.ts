export interface JoinRequest {
    inviteHash: string;
    serverUrl: string;
}

export interface JoinResponse {
    serverName: string;
    memberCount: number;
    owner: string;
    serverUrl: string;
}
