import {
  PendingMemberDto,
  ServerMemberInfoDto,
  ServerMemberDetailDto,
  JoinServerDto,
  ServerListDto,
} from '../dto';

export abstract class ServerMemberService {
  abstract generateInviteHash(serverUrl: string, requestUserPk: number): Promise<{ inviteHash: string }>;
  abstract joinServerDirect(serverUrl: string, userPk: number): Promise<PendingMemberDto>;
  abstract getUserServers(userPk: number): Promise<ServerListDto[]>;
  abstract getServerInfoByInvite(joinDto: JoinServerDto): Promise<{
    serverUrl: string;
    serverName: string;
    memberCount: number;
    owner: string;
  }>;
  abstract getActiveServerMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]>;
  abstract getServerMembersByUrl(
    serverUrl: string,
    requestUserPk: number,
  ): Promise<ServerMemberInfoDto[] | ServerMemberDetailDto[]>;
  abstract leaveServer(serverUrl: string, userPk: number): Promise<{ message: string }>;
}
