import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ServerRoleUtils,
  MemberStatus,
} from '../../../../common/enums';
import { ServerRepository } from '../../repositories/server.repository';
import { ServerMemberRepository } from '../../repositories/server-member.repository';
import { UserRepository } from 'src/domain/user/repositories/user.repository';
import { ProjectRepository } from 'src/domain/project/repositories/project.repository';
import { ProjectMemberRepository } from 'src/domain/project/repositories/project-member.repository';
import { ChannelRepository } from 'src/domain/channel/repositories/channel.repository';
import { ChannelMemberRepository } from 'src/domain/channel/repositories/channel-member.repository';
import { ServerMemberService } from '../server-member.service';
import {
  PendingMemberDto,
  ServerMemberInfoDto,
  ServerMemberDetailDto,
  JoinServerDto,
  ServerListDto,
} from '../../dto';
import { RedisService } from '../../../../common/redis/redis.service'; // RedisService 추가

@Injectable()
export class ServerMemberServiceImpl extends ServerMemberService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly serverMemberRepository: ServerMemberRepository,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly channelMemberRepository: ChannelMemberRepository,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  // 서버 초대 링크 생성
  async generateInviteHash(
    serverUrl: string,
    requestUserPk: number,
  ): Promise<{ inviteHash: string }> {

    const server = await this.serverRepository.findOne({ serverUrl });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    const serverPk = server.serverPk

    // 2. 요청자가 서버 관리자인지 확인
    const serverMember = await this.serverMemberRepository.findOne({ serverPk, userPk: requestUserPk });

    if (
      !serverMember ||
      !ServerRoleUtils.hasAdminPermission(serverMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 초대 링크를 생성할 수 있습니다',
      );
    }

    // 3. 고유 해시 생성 (UUID 사용)
    const newInviteHash = uuidv4().substring(0, 12); // 12자리 해시

    // 4. Redis에 초대 해시와 serverPk 저장 (7일 TTL)
    // Redis의 TTL은 초 단위이므로 7일 * 24시간 * 60분 * 60초 = 604800초
    const TTL = 7 * 24 * 60 * 60;
    await this.redisService.set(
      `server_invite_hash:${newInviteHash}`,
      server.serverPk.toString(),
      TTL,
    );

    return {
      inviteHash: newInviteHash,
    };
  }

  // 직접 서버 가입 신청 (serverUrl로)
  async joinServerDirect(
    serverUrl: string,
    userPk: number,
  ): Promise<PendingMemberDto> {
    // 1. 서버 존재 확인

    const server = await this.serverRepository.findOne({ serverUrl });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    const serverPk = server.serverPk

    // 2. 사용자 존재 확인
    const user = await this.userRepository.findByPk(userPk);

    if (!user) {
      throw new NotFoundException(`사용자 ID를 찾을 수 없습니다`);
    }

    // 3. 이미 서버 멤버인지 확인
    const existingMember = await this.serverMemberRepository.findOne({ serverPk, userPk });

    if (existingMember) {
      // Active 상태인 경우 기본 프로젝트와 채널 정보도 함께 반환
      let defaultProject, defaultChannel;
      if (existingMember.sStatus === 'Active') {
        // 기본 "일반" 프로젝트 조회
        const project = await this.projectRepository.findOne(
          {
            serverPk: server.serverPk,
            projectName: '일반',
            isDeletedProject: false,
          }
        );

        if (project) {
          defaultProject = {
            projectPk: project.projectPk,
            projectName: project.projectName,
          };

          // 해당 프로젝트의 기본 "일반" 채널 조회
          const channel = await this.channelRepository.findOne({
              projectPk: project.projectPk,
              channelName: '일반',
          });

          if (channel) {
            defaultChannel = {
              channelPk: channel.channelPk,
              channelName: channel.channelName,
            };
          }
        }
      }

      return {
        sStatus: existingMember.sStatus,
        userInfo: {
          user_name: user.userName,
          user_email: user.userEmail,
          profile_image_path: user.profileImagePath,
        },
        ...(defaultProject && { defaultProject }),
        ...(defaultChannel && { defaultChannel }),
      };
    }

    // 4. 가입 신청 생성 (Pending 상태)
    const serverMember = await this.serverMemberRepository.save({
      serverPk: server.serverPk,
      userPk,
      sStatus: 'Pending',
      serverRole: 'member',
    });

    return {
      sStatus: serverMember.sStatus,
      userInfo: {
        user_name: user.userName,
        user_email: user.userEmail,
        profile_image_path: user.profileImagePath,
      },
    };
  }

  // 유저가 속한 서버 목록 조회
  async getUserServers(userPk: number): Promise<ServerListDto[]> {
    const serverMembers = await this.serverMemberRepository.findAll({ userPk }, ['server'] );

    return serverMembers
      .filter((member) => !member.server.isDeletedServer)
      .map((member) => ({
        serverUrl: member.server.serverUrl,
        serverName: member.server.serverName,
        serverRole: member.serverRole,
      }));
  }

  // 초대 링크로 서버 정보 조회
  async getServerInfoByInvite(joinDto: JoinServerDto): Promise<{
    serverUrl: string;
    serverName: string;
    memberCount: number;
    owner: string;
  }> {
    // 1. 해시로 초대 링크 찾기 (Redis에서)
    const serverPkString = await this.redisService.get(
      `server_invite_hash:${joinDto.inviteHash}`,
    );

    if (!serverPkString) {
      throw new NotFoundException('잘못되었거나 만료된 초대 링크입니다');
    }

    const serverPk = parseInt(serverPkString, 10);

    const server = await this.serverRepository.findOne({ serverPk });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    // 4. 사용자 존재 확인
    const user = await this.userRepository.findByPk(joinDto.userPk);

    if (!user) throw new NotFoundException(`사용자 ID를 찾을 수 없습니다`);
    

    // 5. 서버 멤버 수 조회
    const memberCount = await this.serverMemberRepository.count({ serverPk: server.serverPk });

    // 6. 서버 Owner 정보 조회
    const ownerMember = await this.serverMemberRepository.findOne(
      { serverPk: server.serverPk, serverRole: 'owner' },
      ['user']
    );

    if (!ownerMember || !ownerMember.user) {
      throw new NotFoundException('서버 소유자를 찾을 수 없습니다.');
    }

    // 7. 서버 정보 반환
    return {
      serverUrl: server.serverUrl,
      serverName: server.serverName,
      memberCount: memberCount,
      owner: ownerMember.user.userName,
    };
  }

  // 서버 멤버 목록 조회 (모든 상태)
  async getActiveServerMembers(
    serverPk: number,
    requestUserPk: number,
  ): Promise<PendingMemberDto[]> {

    const server = await this.serverRepository.findOne({ serverPk, isDeletedServer: false });

    if (!server) throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    
    // 2. 요청자가 서버 멤버인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      serverPk,
      userPk: requestUserPk,
      sStatus: 'Active',    
    });

    if (!requestMember) throw new ForbiddenException('서버 멤버만 멤버 목록을 볼 수 있습니다');
    

    // 3. 모든 멤버 목록 조회 (모든 상태)
    const allMembers = await this.serverMemberRepository.findAll(
      { serverPk },
      ['user'],
      { serverMemberPk: 'ASC' },
    );

    return allMembers.map((member) => ({
      sStatus: member.sStatus,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // serverUrl로 서버 멤버 목록 조회 (권한에 따라 다른 정보 반환)
  async getServerMembersByUrl(
    serverUrl: string,
    requestUserPk: number,
  ): Promise<ServerMemberInfoDto[] | ServerMemberDetailDto[]> {

    // 1.5. 유효성이 확인된 서버 객체를 다시 로드
    const server = await this.serverRepository.findOne(
      { serverUrl, isDeletedServer: false },
    );

    if (!server) {
      throw new NotFoundException(
        `서버 URL ${serverUrl}을 찾을 수 없습니다 (내부 오류).`,
      );
    }

    // 2. 요청자의 서버 멤버 정보 확인
    const requestMember = await this.serverMemberRepository.findOne(
      {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    );

    if (!requestMember) {
      throw new ForbiddenException('서버 멤버만 멤버 목록을 볼 수 있습니다');
    }

    // 3. 모든 멤버 목록 조회 (모든 상태)
    const allMembers = await this.serverMemberRepository.findAll(
      { serverPk: server.serverPk },
      ['user'],
      { serverMemberPk: 'ASC' },
    );

    // 4. 권한에 따라 다른 정보 반환
    const isAdmin = ServerRoleUtils.hasAdminPermission(
      requestMember.serverRole,
    );

    if (isAdmin) {
      // Admin/Owner: 상세 정보 포함
      return allMembers.map((member) => ({
        sStatus: member.sStatus,
        serverRole: member.serverRole,
        userInfo: {
          userName: member.user.userName,
          userEmail: member.user.userEmail,
          profileImagePath: member.user.profileImagePath,
        },
      }));
    } else {
      // Member: 기본 정보만
      return allMembers.map((member) => ({
        userInfo: {
          userName: member.user.userName,
          userEmail: member.user.userEmail,
          profileImagePath: member.user.profileImagePath,
        },
      }));
    }
  }

  // 서버 나가기 (사용자 본인)
  async leaveServer(
    serverUrl: string,
    userPk: number,
  ): Promise<{ message: string }> {

    const server = await this.serverRepository.findOne({ serverUrl });

    if (!server) throw new NotFoundException( `서버 URL ${serverUrl}을 찾을 수 없습니다`);
    

    // 2. 요청자가 서버 멤버인지 확인
    const serverMember = await this.serverMemberRepository.findOne(
      {
        serverPk: server.serverPk,
        userPk,
        sStatus: 'Active',
      },
      ['user'],
    );

    if (!serverMember) {
      throw new NotFoundException('서버 멤버가 아닙니다');
    }

    // 3. 서버 소유자는 나갈 수 없음 (Owner는 서버를 삭제해야 함)
    if (serverMember.serverRole === 'owner') {
      throw new ForbiddenException(
        '서버 소유자는 서버를 나갈 수 없습니다. 서버를 삭제해야 합니다.',
      );
    }

    // --- transaction ---

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // 4. 서버에서 나가기 처리 (Inactive로 변경)
      serverMember.sStatus = MemberStatus.INACTIVE;
      await this.serverMemberRepository.save(serverMember);

      // 5. 유저를 서버 내의 가입 중인 모든 프로젝트에서 나가기 처리
      await this.projectMemberRepository.deactivateUserInServer(
        manager,
        server.serverPk,
        userPk,
      );

      // 6. 유저를 서버 내의 가입 중인 모든 채널에서 나가기 처리
      await this.channelMemberRepository.deactivateUserInServer(
        manager,
        server.serverPk,
        userPk,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('서버 나가기 처리 중 트랜잭션 오류:', err);
      throw new InternalServerErrorException(`나가기 처리 중 알 수 없는 오류가 발생했습니다.`)
    } finally {
      await queryRunner.release();
    }
    // TODO: Spring 서버로 멤버 제거 알림 전송

    return { message: '서버에서 나갔습니다' };
  }
}
