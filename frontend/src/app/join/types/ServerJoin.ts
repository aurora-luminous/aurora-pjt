export interface ServerInfo {
    serverName: string;
    serverMemberCount: number;
    serverOwner: string;
}

export interface JoinRequest {
    inviteHash: string;
    serverUrl: string;
}

export interface JoinResponse {
    serverName: string;
    serverUrl: string;
}
