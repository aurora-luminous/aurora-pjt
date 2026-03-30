import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid'; // Unique hash generation
import { Server } from '../entities/server.entity';
import { ServerMember } from '../entities/server-member.entity';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import {
  ServerRoleUtils,
  ServerRoleType,
} from '../../../common/enums/member-role.enum';
import {
  MemberStatus,
  ServerMemberStatus,
  MemberStatusUtils,
} from '../../../common/enums/member-status.enum';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { Channel } from '../../channel/entities/channel.entity';
import { ChannelMember } from '../../channel/entities/channel-member.entity';
import { ServerRolePermissionService } from './server-role-permission.service';
import {
  PendingMemberDto,
  ServerMemberInfoDto,
  ServerMemberDetailDto,
  UpdateMemberStatusDto,
  JoinServerDto,
  ServerInviteDto,
} from '../dto';
import { RedisService } from '../../../common/redis/redis.service'; // RedisService 추가
import { findActiveEntityById } from '../../../common/utils/entity-status.util'; // findActiveEntityById import

@Injectable()
export class ServerInvitationService {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    private readonly redisService: RedisService, // RedisService 주입
    private readonly configService: ConfigService,
    private readonly serverRolePermissionService: ServerRolePermissionService,
  ) {}

  // 서버 초대 링크 생성
  async generateInviteHash(
    serverPk: number,
    requestUserPk: number,
  ): Promise<{ inviteHash: string }> {
    // 1. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

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
    await findActiveEntityById(
      this.serverRepository,
      serverUrl,
      '서버',
      'serverUrl',
      'isDeletedServer',
    );

    const server = await this.serverRepository.findOne({
      where: { serverUrl, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    // 2. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(`사용자 ID ${userPk}를 찾을 수 없습니다`);
    }

    // 3. 이미 서버 멤버인지 확인
    const existingMember = await this.serverMemberRepository.findOne({
      where: { serverPk: server.serverPk, userPk },
    });

    if (existingMember) {
      // Active 상태인 경우 기본 프로젝트와 채널 정보도 함께 반환
      let defaultProject, defaultChannel;
      if (existingMember.sStatus === 'Active') {
        // 기본 "일반" 프로젝트 조회
        const project = await this.projectRepository.findOne({
          where: {
            serverPk: server.serverPk,
            projectName: '일반',
            isDeletedProject: false,
          },
        });

        if (project) {
          defaultProject = {
            projectPk: project.projectPk,
            projectName: project.projectName,
          };

          // 해당 프로젝트의 기본 "일반" 채널 조회
          const channel = await this.channelRepository.findOne({
            where: {
              projectPk: project.projectPk,
              channelName: '일반',
              isDeletedChannel: false,
            },
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
    const serverMember = this.serverMemberRepository.create({
      serverPk: server.serverPk,
      userPk,
      sStatus: 'Pending',
      serverRole: 'member',
    });
    const savedMember = await this.serverMemberRepository.save(serverMember);

    return {
      sStatus: savedMember.sStatus,
      userInfo: {
        user_name: user.userName,
        user_email: user.userEmail,
        profile_image_path: user.profileImagePath,
      },
    };
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

    // 3. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다`);
    }

    // 4. 사용자 존재 확인 (유효한 사용자인지만 확인)
    const user = await this.userRepository.findOne({
      where: { userPk: joinDto.userPk, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(
        `사용자 ID ${joinDto.userPk}를 찾을 수 없습니다`,
      );
    }

    // 5. 서버 멤버 수 조회
    const memberCount = await this.serverMemberRepository.count({
      where: { serverPk: server.serverPk, sStatus: 'Active' },
    });

    // 6. 서버 Owner 정보 조회
    const ownerMember = await this.serverMemberRepository.findOne({
      where: { serverPk: server.serverPk, serverRole: 'owner' },
      relations: ['user'],
    });

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

  // 서버 승인 대기 목록 조회
  async getPendingMembers(
    serverPk: number,
    requestUserPk: number,
  ): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

    if (
      !requestMember ||
      !ServerRoleUtils.hasAdminPermission(requestMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 대기 중인 멤버를 볼 수 있습니다',
      );
    }

    // 3. 대기 중인 멤버 목록 조회
    const pendingMembers = await this.serverMemberRepository.find({
      where: { serverPk, sStatus: 'Pending' },
      relations: ['user'],
      order: { serverMemberPk: 'ASC' }, // 신청 순서대로
    });

    return pendingMembers.map((member) => ({
      sStatus: member.sStatus,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // 서버 가입 승인/거절
  async updateMemberStatus(
    serverMemberPk: number,
    updateDto: UpdateMemberStatusDto,
  ): Promise<PendingMemberDto> {
    // 1. 서버 멤버 존재 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk },
      relations: ['user', 'server'],
    });

    if (!serverMember) {
      throw new NotFoundException(
        `서버 멤버 ID ${serverMemberPk}를 찾을 수 없습니다`,
      );
    }

    // 2. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: serverMember.serverPk,
        userPk: updateDto.adminUserPk,
        sStatus: 'Active',
      },
    });

    if (
      !adminMember ||
      !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 멤버를 승인/거절할 수 있습니다',
      );
    }

    // 3. 상태가 Pending인지 확인
    if (serverMember.sStatus !== 'Pending') {
      throw new ConflictException(
        '대기 중인 멤버만 승인 또는 거절할 수 있습니다',
      );
    }

    // 4. 상태 업데이트 (Active 또는 Inactive만 허용)
    if (!['Active', 'Inactive'].includes(updateDto.sStatus)) {
      throw new ConflictException(
        '잘못된 상태입니다. 대기 멤버는 Active 또는 Inactive만 허용됩니다',
      );
    }

    // 5. 상태 업데이트
    await this._updateServerMemberStatus(
      serverMember.serverMemberPk,
      updateDto.sStatus,
    );

    // 업데이트된 멤버 정보를 다시 가져오기
    const updatedMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk },
      relations: ['user'],
    });

    if (!updatedMember) {
      throw new NotFoundException(
        `유저 ${serverMemberPk}의 상태 변경에 실패했습니다.`,
      );
    }

    return {
      sStatus: updatedMember.sStatus,
      userInfo: {
        user_name: updatedMember.user.userName,
        user_email: updatedMember.user.userEmail,
        profile_image_path: updatedMember.user.profileImagePath,
      },
    };
  }

  async updateMemberStatusByEmail(
    serverPk: number,
    userEmail: string,
    sStatus: 'Active' | 'Inactive' | 'Banned',
    adminUserPk: number,
  ): Promise<PendingMemberDto> {
    // 1. userEmail로 사용자 찾기
    const user = await this.userService.getUserByEmail(userEmail);

    // 2. 서버 멤버 찾기
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: user.userPk },
      relations: ['user', 'server'],
    });

    if (!serverMember) {
      throw new NotFoundException(
        `사용자 ${userEmail}이 이 서버의 멤버가 아닙니다`,
      );
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: adminUserPk,
        sStatus: 'Active',
      },
    });

    if (
      !adminMember ||
      !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 멤버를 승인/거절할 수 있습니다',
      );
    }

    // 4. 상태가 Pending인지 확인 (Banned는 예외)
    if (serverMember.sStatus !== 'Pending' && sStatus !== 'Banned') {
      throw new ConflictException(
        '대기 중인 멤버만 승인 또는 거절할 수 있습니다',
      );
    }

    // 5. 상태 업데이트
    await this._updateServerMemberStatus(serverMember.serverMemberPk, sStatus);

    // 6. Active로 승인된 경우, 기본 "일반" 프로젝트와 채널에 자동 가입
    if (sStatus === 'Active') {
      await this.addMemberToDefaultProjectAndChannel(serverPk, user.userPk);
    }

    // 업데이트된 멤버 정보를 다시 가져오기
    const updatedMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk: serverMember.serverMemberPk },
      relations: ['user'],
    });

    if (!updatedMember) {
      throw new NotFoundException(
        `유저 ${serverMember.serverMemberPk}의 상태 변경에 실패했습니다.`,
      );
    }

    return {
      sStatus: updatedMember.sStatus,
      userInfo: {
        user_name: user.userName,
        user_email: user.userEmail,
        profile_image_path: user.profileImagePath,
      },
    };
  }

  // 기본 프로젝트와 모든 public 채널에 멤버 자동 추가 (private helper)
  private async addMemberToDefaultProjectAndChannel(
    serverPk: number,
    userPk: number,
  ): Promise<void> {
    // 1. 기본 "일반" 프로젝트 찾기
    const defaultProject = await this.projectRepository.findOne({
      where: {
        serverPk,
        projectName: '일반',
        isDeletedProject: false,
      },
    });

    if (!defaultProject) {
      // 일반 프로젝트가 없으면 자동 가입 스킵 (에러는 던지지 않음)
      console.warn(`서버 ${serverPk}에 기본 "일반" 프로젝트가 없습니다.`);
      return;
    }

    // 2. 이미 프로젝트 멤버인지 확인
    const existingProjectMember = await this.projectMemberRepository.findOne({
      where: { projectPk: defaultProject.projectPk, userPk },
    });

    if (!existingProjectMember) {
      // 프로젝트 멤버로 추가
      const projectMember = this.projectMemberRepository.create({
        projectPk: defaultProject.projectPk,
        userPk,
        pStatus: 'Active',
        projectRole: 'member',
      });
      await this.projectMemberRepository.save(projectMember);
    }

    // 3. 일반 프로젝트의 모든 public 채널에 자동 추가
    await this.addMemberToPublicChannels(defaultProject.projectPk, userPk);
  }

  // 프로젝트의 모든 public 채널에 멤버를 추가하는 헬퍼 메서드
  private async addMemberToPublicChannels(
    projectPk: number,
    userPk: number,
  ): Promise<void> {
    // 해당 프로젝트의 모든 public 채널 조회
    const publicChannels = await this.channelRepository.find({
      where: {
        projectPk,
        isDeletedChannel: false,
        accessType: 'PUBLIC', // isPrivate 대신 accessType 사용
      },
    });

    if (publicChannels.length === 0) {
      console.warn(`프로젝트 ${projectPk}에 public 채널이 없습니다.`);
      return;
    }

    // 이미 가입된 채널 확인
    const existingChannelMembers = await this.channelMemberRepository.find({
      where: {
        userPk,
        channelPk: In(publicChannels.map((ch) => ch.channelPk)),
      },
    });

    const existingChannelPks = new Set(
      existingChannelMembers.map((m) => m.channelPk),
    );

    // 아직 가입되지 않은 public 채널에만 추가
    const channelMembersToAdd = publicChannels
      .filter((channel) => !existingChannelPks.has(channel.channelPk))
      .map((channel) =>
        this.channelMemberRepository.create({
          channelPk: channel.channelPk,
          userPk: userPk,
          cStatus: 'Active',
          channelRole: 'member',
        }),
      );

    if (channelMembersToAdd.length > 0) {
      await this.channelMemberRepository.save(channelMembersToAdd);
    }
  }

  // 서버 멤버 목록 조회 (모든 상태)
  async getActiveServerMembers(
    serverPk: number,
    requestUserPk: number,
  ): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    }

    // 2. 요청자가 서버 멤버인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

    if (!requestMember) {
      throw new ForbiddenException('서버 멤버만 멤버 목록을 볼 수 있습니다');
    }

    // 3. 모든 멤버 목록 조회 (모든 상태)
    const allMembers = await this.serverMemberRepository.find({
      where: { serverPk },
      relations: ['user'],
      order: { serverMemberPk: 'ASC' },
    });

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

  // 밴당한 멤버 목록 조회 (관리자만)
  async getBannedMembers(
    serverPk: number,
    requestUserPk: number,
  ): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인 (가드 역할)
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    // 1.5. 유효성이 확인된 서버 객체를 다시 로드
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

    if (
      !requestMember ||
      !ServerRoleUtils.hasAdminPermission(requestMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 차단된 멤버를 볼 수 있습니다',
      );
    }

    // 3. 밴된 멤버 목록 조회
    const bannedMembers = await this.serverMemberRepository.find({
      where: { serverPk, sStatus: 'Banned' },
      relations: ['user'],
      order: { serverMemberPk: 'DESC' }, // 최근 밴된 순서
    });

    return bannedMembers.map((member) => ({
      sStatus: member.sStatus,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // 밴당한 멤버 복구 (Owner만 가능)
  async unbanMember(
    serverMemberPk: number,
    adminUserPk: number,
  ): Promise<PendingMemberDto> {
    // 1. 밴된 멤버 확인
    const bannedMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk, sStatus: 'Banned' },
      relations: ['user', 'server'],
    });

    if (!bannedMember) {
      throw new NotFoundException('차단된 멤버를 찾을 수 없습니다');
    }

    // 2. 관리자 권한 확인 (Owner만 언밴 가능)
    const adminMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: bannedMember.serverPk,
        userPk: adminUserPk,
        sStatus: 'Active',
      },
    });

    if (!adminMember || adminMember.serverRole !== 'owner') {
      throw new ForbiddenException(
        '서버 소유자만 멤버의 차단을 해제할 수 있습니다',
      );
    }

    // 3. 상태를 Active로 복구
    await this._updateServerMemberStatus(bannedMember.serverMemberPk, 'Active');

    // 업데이트된 멤버 정보를 다시 가져옵니다.
    const unbannedMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk: bannedMember.serverMemberPk },
      relations: ['user'],
    });

    if (!unbannedMember) {
      throw new NotFoundException(
        `유저 ${bannedMember.serverMemberPk} 차단 해제 실패.`,
      );
    }

    return {
      sStatus: unbannedMember.sStatus,
      userInfo: {
        user_name: unbannedMember.user.userName,
        user_email: unbannedMember.user.userEmail,
        profile_image_path: unbannedMember.user.profileImagePath,
      },
    };
  }

  async banMember(
    serverPk: number,
    targetUserPk: number,
    adminUserPk: number,
  ): Promise<void> {
    // 1. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    // 1.5. 유효성이 확인된 서버 객체를 다시 로드
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    }

    // 2. 차단할 멤버 확인 (승인된 멤버만)
    const targetMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: targetUserPk, sStatus: 'Active' },
    });

    if (!targetMember) {
      throw new NotFoundException(
        '대상 사용자가 이 서버의 활성 멤버가 아닙니다',
      );
    }

    // 3. ban_members 권한 확인 (DB 권한 시스템 사용)
    const hasBanPermission =
      await this.serverRolePermissionService.hasPermission(
        serverPk,
        adminUserPk,
        'banMembers',
      );

    if (!hasBanPermission) {
      throw new ForbiddenException('멤버 차단 권한이 없습니다');
    }

    // 요청자 정보 조회 (Owner 여부 확인용)
    const adminMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: adminUserPk, sStatus: 'Active' },
    });

    if (!adminMember) {
      throw new ForbiddenException('서버 멤버가 아닙니다');
    }

    // 4. Owner는 차단할 수 없음
    if (targetMember.serverRole === 'owner') {
      throw new ForbiddenException('서버 소유자는 차단할 수 없습니다');
    }

    // 5. Admin끼리는 차단 불가 (Owner만 Admin 차단 가능)
    if (
      targetMember.serverRole === 'admin' &&
      adminMember.serverRole !== 'owner'
    ) {
      throw new ForbiddenException(
        '서버 소유자만 관리자 멤버를 차단할 수 있습니다',
      );
    }

    // 6. 논리적 삭제 (상태를 'Banned'로 변경)
    await this._updateServerMemberStatus(targetMember.serverMemberPk, 'Banned');
  }

  // serverUrl로 서버 멤버 목록 조회 (권한에 따라 다른 정보 반환)
  async getServerMembersByUrl(
    serverUrl: string,
    requestUserPk: number,
  ): Promise<ServerMemberInfoDto[] | ServerMemberDetailDto[]> {
    // 1. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverUrl,
      '서버',
      'serverUrl',
      'isDeletedServer',
    );

    // 1.5. 유효성이 확인된 서버 객체를 다시 로드
    const server = await this.serverRepository.findOne({
      where: { serverUrl, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(
        `서버 URL ${serverUrl}을 찾을 수 없습니다 (내부 오류).`,
      );
    }

    // 2. 요청자의 서버 멤버 정보 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

    if (!requestMember) {
      throw new ForbiddenException('서버 멤버만 멤버 목록을 볼 수 있습니다');
    }

    // 3. 모든 멤버 목록 조회 (모든 상태)
    const allMembers = await this.serverMemberRepository.find({
      where: { serverPk: server.serverPk },
      relations: ['user'],
      order: { serverMemberPk: 'ASC' },
    });

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
    // 1. 서버 존재 확인
    await findActiveEntityById(
      this.serverRepository,
      serverUrl,
      '서버',
      'serverUrl',
      'isDeletedServer',
    );

    const server = await this.serverRepository.findOne({
      where: { serverUrl, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(
        `서버 URL ${serverUrl}을 찾을 수 없습니다 (내부 오류).`,
      );
    }

    // 2. 요청자가 서버 멤버인지 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: server.serverPk,
        userPk,
        sStatus: 'Active',
      },
      relations: ['user'],
    });

    if (!serverMember) {
      throw new NotFoundException('서버의 활성 멤버가 아닙니다');
    }

    // 3. 서버 소유자는 나갈 수 없음 (Owner는 서버를 삭제해야 함)
    if (serverMember.serverRole === 'owner') {
      throw new ForbiddenException(
        '서버 소유자는 서버를 나갈 수 없습니다. 서버를 삭제해야 합니다.',
      );
    }

    // 4. 상태를 Inactive로 변경 (soft delete)
    await this._updateServerMemberStatus(
      serverMember.serverMemberPk,
      'Inactive',
    );

    // 5. 해당 서버 내의 모든 프로젝트와 채널에서 사용자의 멤버십 상태를 Inactive로 변경
    const projectsInServer = await this.projectRepository.find({
      where: { serverPk: server.serverPk, isDeletedProject: false },
      select: ['projectPk'],
    });

    for (const project of projectsInServer) {
      // 프로젝트 멤버십 비활성화
      const projectMember = await this.projectMemberRepository.findOne({
        where: { projectPk: project.projectPk, userPk, pStatus: 'Active' },
      });
      if (projectMember) {
        projectMember.pStatus = 'Inactive';
        await this.projectMemberRepository.save(projectMember);
      }

      // 채널 멤버십 비활성화
      const channelMembersInProject = await this.channelMemberRepository
        .createQueryBuilder('cm')
        .leftJoin('cm.channel', 'channel')
        .where('cm.userPk = :userPk', { userPk })
        .andWhere('channel.projectPk = :projectPk', {
          projectPk: project.projectPk,
        })
        .getMany();

      if (channelMembersInProject.length > 0) {
        channelMembersInProject.forEach((cm) => {
          cm.cStatus = 'Inactive';
        });
        await this.channelMemberRepository.save(channelMembersInProject);
      }
    }
    // TODO: Spring 서버로 멤버 제거 알림 전송

    return { message: '서버에서 나갔습니다' };
  }

  private async _updateServerMemberStatus(
    serverMemberPk: number,
    newStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned',
  ): Promise<void> {
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk },
    });

    if (!serverMember) {
      throw new NotFoundException(
        `서버멤버 ${serverMemberPk} 를 찾을 수 없습니다.`,
      );
    }

    serverMember.sStatus = newStatus;
    await this.serverMemberRepository.save(serverMember);
  }
}
