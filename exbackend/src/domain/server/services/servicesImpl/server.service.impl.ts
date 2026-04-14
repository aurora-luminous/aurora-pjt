import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../entities/server.entity';
import { ServerMember } from '../../entities/server-member.entity';
import { User } from '../../../user/entities/user.entity';
import { ProjectService } from '../../../project/services/project.service';
import { ServerRolePermissionService } from '../server-role-permission.service';
import { CreateServerDto, ServerResponseDto, ServerListDto } from '../../dto';
import { findActiveEntityById } from '../../../../common/utils/entity-status.util';

@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly projectService: ProjectService,
    private readonly serverRolePermissionService: ServerRolePermissionService,
  ) {}

  async createServer(
    createServerDto: CreateServerDto,
  ): Promise<ServerResponseDto> {
    // 1. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk: createServerDto.creatorUserPk, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(
        `사용자 ID ${createServerDto.serverUrl}를 찾을 수 없습니다`,
      );
    }

    // 영문 및 숫자인지 검사
    const ONLY_ENGLISH_AND_NUMBERS = /^[A-Za-z0-9]+$/;

    if (!ONLY_ENGLISH_AND_NUMBERS.test(createServerDto.serverUrl)) {
      throw new BadRequestException('서버 URL은 영문만 입력할 수 있습니다.');
    }

    // 2. 서버 생성
    const isExistServer = await this.serverRepository.findOne({
      where: { serverUrl: createServerDto.serverUrl, isDeletedServer: false },
    });

    if (isExistServer) {
      throw new ConflictException(
        `이미 중복된 URL ${createServerDto.creatorUserPk}이 존재합니다.`,
      );
    }

    const server = this.serverRepository.create({
      serverName: createServerDto.serverName,
      serverUrl: createServerDto.serverUrl,
    });
    const savedServer = await this.serverRepository.save(server);

    // 3. 생성자를 owner로 서버 멤버에 추가
    const serverMember = this.serverMemberRepository.create({
      userPk: createServerDto.creatorUserPk,
      serverPk: savedServer.serverPk,
      sStatus: 'Active',
      serverRole: 'owner', // 생성자는 owner 권한
    });
    await this.serverMemberRepository.save(serverMember);

    // 4. 서버 기본 권한 생성
    await this.serverRolePermissionService.createDefaultPermissions(
      savedServer.serverPk,
    );

    // 5. 기본 "일반" 프로젝트 생성 (채널도 함께 생성됨)
    await this.projectService.createProject({
      serverPk: savedServer.serverPk,
      projectName: '일반',
      creatorUserPk: createServerDto.creatorUserPk,
    });

    return {
      serverPk: savedServer.serverPk,
      serverName: savedServer.serverName,
      serverUrl: savedServer.serverUrl,
      isDeletedServer: savedServer.isDeletedServer,
      ownerInfo: {
        userName: user.userName,
        userEmail: user.userEmail,
      },
    };
  }

  async getUserServers(userPk: number): Promise<ServerListDto[]> {
    const serverMembers = await this.serverMemberRepository.find({
      where: {
        userPk: userPk,
      },
      relations: ['server'],
    });

    return serverMembers
      .filter((member) => !member.server.isDeletedServer)
      .map((member) => ({
        serverUrl: member.server.serverUrl,
        serverName: member.server.serverName,
        serverRole: member.serverRole,
      }));
  }

  async getAllServers(): Promise<ServerResponseDto[]> {
    const servers = await this.serverRepository.find({
      where: { isDeletedServer: false },
      relations: ['serverMembers', 'serverMembers.user'],
    });

    return servers.map((server) => {
      const owner = server.serverMembers.find(
        (member) => member.serverRole === 'owner',
      );

      return {
        serverPk: server.serverPk,
        serverName: server.serverName,
        serverUrl: server.serverUrl,
        isDeletedServer: server.isDeletedServer,
        ownerInfo: owner
          ? {
              userName: owner.user.userName,
              userEmail: owner.user.userEmail,
            }
          : undefined,
      };
    });
  }

  async getServerById(serverPk: number): Promise<ServerResponseDto> {
    // 1. findActiveEntityById를 사용하여 서버의 존재 및 활성 상태를 확인 (가드 역할)
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    // 2. 유효성이 확인된 서버 객체를 relations와 함께 다시 로드
    // findActiveEntityById에서 이미 활성 상태임을 확인했으므로, 여기서는 해당 조건으로만 조회
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
      relations: ['serverMembers', 'serverMembers.user'],
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    const owner = server.serverMembers.find(
      (member) => member.serverRole === 'owner',
    );

    return {
      serverPk: server.serverPk,
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      isDeletedServer: server.isDeletedServer,
      ownerInfo: owner
        ? {
            userName: owner.user.userName,
            userEmail: owner.user.userEmail,
          }
        : undefined,
    };
  }

  async getServerByUrl(serverUrl: string): Promise<ServerResponseDto> {
    // 1. findActiveEntityById를 사용하여 서버의 존재 및 활성 상태를 확인 (가드 역할)
    await findActiveEntityById(
      this.serverRepository,
      serverUrl,
      '서버',
      'serverUrl',
      'isDeletedServer',
    );

    // 2. 유효성이 확인된 서버 객체를 relations와 함께 다시 로드
    // findActiveEntityById에서 이미 활성 상태임을 확인했으므로, 여기서는 해당 조건으로만 조회
    const server = await this.serverRepository.findOne({
      where: { serverUrl, isDeletedServer: false },
      relations: ['serverMembers', 'serverMembers.user'],
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    const owner = server.serverMembers.find(
      (member) => member.serverRole === 'owner',
    );

    return {
      serverPk: server.serverPk,
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      isDeletedServer: server.isDeletedServer,
      ownerInfo: owner
        ? {
            userName: owner.user.userName,
            userEmail: owner.user.userEmail,
          }
        : undefined,
    };
  }
}
