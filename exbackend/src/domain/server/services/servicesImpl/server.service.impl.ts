import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ServerRepository } from '../../repositories/server.repository';
import { ServerMemberRepository } from '../../repositories/server-member.repository';
import { UserRepository } from '../../../user/repositories/user.repository';
import { ProjectService } from '../../../project/services/project.service';
import { ServerRoleRepository } from '../../repositories/server-role.repository';
import { CreateServerDto, ServerResponseDto, ServerListDto } from '../../dto';
import { ServerService } from '../server.service';

// 트랜잭션 처리 위한 import
import { DataSource, In } from 'typeorm';
import { Server } from '../../entities/server.entity';
import { ServerMember } from '../../entities/server-member.entity';
import { Project } from '../../../project/entities/project.entity';
import { ProjectMember } from '../../../project/entities/project-member.entity';
import { Channel } from '../../../channel/entities/channel.entity';
import { ChannelMember } from '../../../channel/entities/channel-member.entity';

@Injectable()
export class ServerServiceImpl extends ServerService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly serverMemberRepository: ServerMemberRepository,
    private readonly serverRoleRepository: ServerRoleRepository,
    private readonly userRepository: UserRepository,
    private readonly projectService: ProjectService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async createServer(
    createServerDto: CreateServerDto,
  ): Promise<ServerResponseDto> {
    // 1. 사용자 존재 확인
    const user = await this.userRepository.findByPk(createServerDto.creatorUserPk);

    if (!user) throw new NotFoundException(`사용자 ID를 찾을 수 없습니다`);

    // 영문 및 숫자인지 검사
    const ONLY_ENGLISH_AND_NUMBERS = /^[A-Za-z0-9]+$/;

    if (!ONLY_ENGLISH_AND_NUMBERS.test(createServerDto.serverUrl)) {
      throw new BadRequestException(`서버 URL은 영문 및 숫자만 입력할 수 있습니다.`);
    }

    // 2. 서버 생성
    const isExistServer = await this.serverRepository.findOne({ serverUrl: createServerDto.serverUrl, isDeletedServer: false });

    if (isExistServer) throw new ConflictException(`이미 중복된 URL ${createServerDto.serverUrl}이 존재합니다.`);

    const server = await this.serverRepository.save({
      serverName: createServerDto.serverName,
      serverUrl: createServerDto.serverUrl,
    });

    // 3. 생성자를 owner로 서버 멤버에 추가
    await this.serverMemberRepository.save({
      userPk: createServerDto.creatorUserPk,
      serverPk: server.serverPk,
      sStatus: 'Active',
      serverRole: 'owner', // 생성자는 owner 권한
    });

    // 4. 서버의 기본 권한 default로 세팅
    await this.serverRoleRepository.saveMany([
      { serverPk: server.serverPk, serverRole: 'owner', kickMembers: true, banMembers: true, manageRoles: true },
      { serverPk: server.serverPk, serverRole: 'admin', kickMembers: true, banMembers: true, manageRoles: true },
      { serverPk: server.serverPk, serverRole: 'projectManager', kickMembers: true, banMembers: true, manageRoles: false },
      { serverPk: server.serverPk, serverRole: 'member', kickMembers: false, banMembers: false, manageRoles: false },
    ]);

    // 5. 기본 프로젝트, 채널 생성
    await this.projectService.createProject({
      serverPk: server.serverPk,
      projectName: '일반',
      creatorUserPk: createServerDto.creatorUserPk,
    });

    return {
      serverPk: server.serverPk,
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      isDeletedServer: server.isDeletedServer,
      ownerInfo: {
        userName: user.userName,
        userEmail: user.userEmail,
      },
    };
  }

  async getUserServers(userPk: number): Promise<ServerListDto[]> {
    const serverMembers = await this.serverMemberRepository.findAll({ userPk }, ['server']);

    return serverMembers
      .filter((member) => !member.server.isDeletedServer)
      .map((member) => ({
        serverUrl: member.server.serverUrl,
        serverName: member.server.serverName,
        serverRole: member.serverRole,
      }));
  }

  async getAllServers(): Promise<ServerResponseDto[]> {
    const servers = await this.serverRepository.findAll({}, ['serverMembers', 'serverMembers.user']);

    return servers.map((server) => {
      const owner = server.serverMembers.find((member) => member.serverRole === 'owner');

      return {
        serverPk: server.serverPk,
        serverName: server.serverName,
        serverUrl: server.serverUrl,
        isDeletedServer: server.isDeletedServer,
        ownerInfo: owner ? { userName: owner.user.userName, userEmail: owner.user.userEmail } : undefined,
      };
    });
  }

  async getServerById(serverPk: number): Promise<ServerResponseDto> {

    const server = await this.serverRepository.findOne({ serverPk }, ['serverMembers', 'serverMembers.user']);

    if (!server) throw new NotFoundException(`서버를 찾을 수 없습니다`);
    
    const owner = server.serverMembers.find((member) => member.serverRole === 'owner');

    return {
      serverPk: server.serverPk,
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      isDeletedServer: server.isDeletedServer,
      ownerInfo: owner ? { userName: owner.user.userName, userEmail: owner.user.userEmail } : undefined,
    };
  }

  async getServerByUrl(serverUrl: string): Promise<ServerResponseDto> {

    const server = await this.serverRepository.findOne({ serverUrl }, ['serverMembers', 'serverMembers.user']);

    if (!server) throw new NotFoundException(`서버를 찾을 수 없습니다`);

    const owner = server.serverMembers.find((member) => member.serverRole === 'owner');

    return {
      serverPk: server.serverPk,
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      isDeletedServer: server.isDeletedServer,
      ownerInfo: owner ? { userName: owner.user.userName, userEmail: owner.user.userEmail } : undefined,
    };
  }

  async deleteServer(serverUrl: string, userPk: number): Promise<void> {
    // 서버 확인, 권한 확인
    const server = await this.serverRepository.findOne({ serverUrl });
    if (!server) throw new NotFoundException(`서버를 찾을 수 없습니다.`);
    const serverPk = server.serverPk;

    const ownerMember = await this.serverMemberRepository.findOne({ serverUrl, userPk });
    if (!ownerMember || ownerMember.serverRole !== 'owner') {
      throw new ForbiddenException(`서버 소유자만 서버를 삭제할 수 있습니다.`);
    } 
    //트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 서버 삭제
      await queryRunner.manager.update(Server, { serverPk }, { isDeletedServer: true });

      // 서버 멤버들 일괄 삭제
      await queryRunner.manager.update(ServerMember, { serverPk, sStatus: 'Active' }, { sStatus: 'Inactive' });

      // 서버에 속한 모든 프로젝트 조회
      const projects = await queryRunner.manager.find(Project, { where: { serverPk, isDeletedProject: false } });

      if (projects.length > 0) {
        const projectPks = projects.map(p => p.projectPk);

        // 프로젝트 일괄 삭제
        await queryRunner.manager.update(Project, { projectPk: In(projectPks) }, { isDeletedProject: true });

        // 프로젝트 멤버 일괄 제거
        await queryRunner.manager.update(ProjectMember, { projectPk: In(projectPks), pStatus: 'Active' }, { pStatus: 'Inactive' });

        // 해당 프로젝트들에 속한 모든 채널 조회
        const channels = await queryRunner.manager.find(Channel, { where: { projectPk: In(projectPks), isDeletedChannel: false } });

        if (channels.length > 0) {
          const channelPks = channels.map(c => c.channelPk);

          // 채널 일괄 삭제
          await queryRunner.manager.update(Channel, { channelPk: In(channelPks) }, { isDeletedChannel: true });

          // 채널 멤버 일괄 삭제
          await queryRunner.manager.update(ChannelMember, { channelPk: In(channelPks), cStatus: 'Active' }, { cStatus: 'Inactive' });
        }
      }
      // 커밋
      await queryRunner.commitTransaction();

    } catch (error) {
      // 에러 시 롤백
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`서버 삭제 중 오류가 발생했습니다.`)
      
    } finally {
      // 트랜잭션 끝
      await queryRunner.release();
    }
  }
}

