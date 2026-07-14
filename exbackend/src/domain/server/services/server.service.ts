import { CreateServerDto, ServerResponseDto, ServerListDto } from '../dto';

export abstract class ServerService {
  abstract createServer(createServerDto: CreateServerDto): Promise<ServerResponseDto>;
  abstract getUserServers(userPk: number): Promise<ServerListDto[]>;
  abstract getAllServers(): Promise<ServerResponseDto[]>;
  abstract getServerById(serverPk: number): Promise<ServerResponseDto>;
  abstract getServerByUrl(serverUrl: string): Promise<ServerResponseDto>;
  abstract deleteServer(serverUrl: string, userPk: number): Promise<void>;
}
