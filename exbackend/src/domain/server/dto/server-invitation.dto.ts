export interface JoinServerDto {
  inviteHash: string;
  userPk: number;
}

export interface ServerInviteDto {
  serverPk: number;
  inviteHash: string;
  inviteLink: string;
}