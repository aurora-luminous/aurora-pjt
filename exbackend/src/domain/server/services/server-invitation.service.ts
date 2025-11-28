import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Server } from '../entities/server.entity';
import { ServerMember } from '../entities/server-member.entity';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { ServerRoleUtils, ServerRoleType } from '../../../common/enums/member-role.enum';
import { MemberStatus, ServerMemberStatus, MemberStatusUtils } from '../../../common/enums/member-status.enum';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { Channel } from '../../text-channel/entities/channel.entity';
import { ChannelMember } from '../../text-channel/entities/channel-member.entity';
import { ServerRolePermissionService } from './server-role-permission.service';
import { PendingMemberDto, ServerMemberInfoDto, ServerMemberDetailDto, UpdateMemberStatusDto, JoinServerDto, ServerInviteDto } from '../dto';

@Injectable()
export class ServerInvitationService {
  private readonly INVITE_SALT = 'server_invite_salt_2024'; // 환경변수로 관리 권장

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
    private readonly configService: ConfigService,
    private readonly serverRolePermissionService: ServerRolePermissionService,
  ) {}

  // serverPk를 해시로 변환
  private generateInviteHash(serverPk: number): string {
    return crypto
      .createHash('sha256')
      .update(`${serverPk}-${this.INVITE_SALT}`)
      .digest('hex')
      .substring(0, 16); // 16자리 해시
  }

  // 해시를 serverPk로 역변환 (모든 서버를 순회해서 매칭)
  private async getServerPkFromHash(inviteHash: string): Promise<number | null> {
    const servers = await this.serverRepository.find({
      where: { isDeletedServer: false },
      select: ['serverPk']
    });

    for (const server of servers) {
      if (this.generateInviteHash(server.serverPk) === inviteHash) {
        return server.serverPk;
      }
    }
    return null;
  }

  // 서버 초대 링크 생성
  async generateInviteLink(serverPk: number, requestUserPk: number): Promise<ServerInviteDto> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active'
      }
    });

    if (!serverMember || !ServerRoleUtils.hasAdminPermission(serverMember.serverRole)) {
      throw new ForbiddenException('서버 관리자 또는 소유자만 초대 링크를 생성할 수 있습니다');
    }

    // 3. 해시 생성 및 링크 생성
    const inviteHash = this.generateInviteHash(serverPk);
    const baseUrl = this.configService.get('SERVER_URL', 'http://localhost:3001'); // env에 배포용 서버 URL 있으면 그거 사용, 없으면 localhost 사용
    const inviteLink = `${baseUrl}/api/ex/servers/${server.serverUrl}/join/${inviteHash}`;

    return {
      serverPk,
      inviteHash,
      inviteLink,
    };
  }

  // 직접 서버 가입 신청 (serverUrl로)
  async joinServerDirect(serverUrl: string, userPk: number): Promise<PendingMemberDto> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverUrl, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다`);
    }

    // 2. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException(`사용자 ID ${userPk}를 찾을 수 없습니다`);
    }

    // 3. 이미 서버 멤버인지 확인
    const existingMember = await this.serverMemberRepository.findOne({
      where: { serverPk: server.serverPk, userPk }
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
            isDeletedProject: false
          }
        });

        if (project) {
          defaultProject = {
            projectPk: project.projectPk,
            projectName: project.projectName
          };

          // 해당 프로젝트의 기본 "일반" 채널 조회
          const channel = await this.channelRepository.findOne({
            where: {
              projectPk: project.projectPk,
              channelName: '일반',
              isDeletedChannel: false
            }
          });

          if (channel) {
            defaultChannel = {
              channelPk: channel.channelPk,
              channelName: channel.channelName
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
  async getServerInfoByInvite(joinDto: JoinServerDto): Promise<{ serverUrl: string; serverName: string }> {
    // 1. 해시로 서버 찾기
    const serverPk = await this.getServerPkFromHash(joinDto.inviteHash);

    if (!serverPk) {
      throw new NotFoundException('잘못된 초대 링크입니다');
    }

    // 2. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException('서버를 찾을 수 없거나 삭제되었습니다');
    }

    // 3. 사용자 존재 확인 (유효한 사용자인지만 확인)
    const user = await this.userRepository.findOne({
      where: { userPk: joinDto.userPk, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException(`사용자 ID ${joinDto.userPk}를 찾을 수 없습니다`);
    }

    // 4. 서버 정보만 반환
    return {
      serverUrl: server.serverUrl,
      serverName: server.serverName
    };
  }

  // 서버 승인 대기 목록 조회
  async getPendingMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active'
      }
    });

    if (!requestMember || !ServerRoleUtils.hasAdminPermission(requestMember.serverRole)) {
      throw new ForbiddenException('서버 관리자 또는 소유자만 대기 중인 멤버를 볼 수 있습니다');
    }

    // 3. 대기 중인 멤버 목록 조회
    const pendingMembers = await this.serverMemberRepository.find({
      where: { serverPk, sStatus: 'Pending' },
      relations: ['user'],
      order: { serverMemberPk: 'ASC' }, // 신청 순서대로
    });

    return pendingMembers.map(member => ({
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
    updateDto: UpdateMemberStatusDto
  ): Promise<PendingMemberDto> {
    // 1. 서버 멤버 존재 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk },
      relations: ['user', 'server']
    });

    if (!serverMember) {
      throw new NotFoundException(`서버 멤버 ID ${serverMemberPk}를 찾을 수 없습니다`);
    }

    // 2. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: serverMember.serverPk,
        userPk: updateDto.adminUserPk,
        sStatus: 'Active'
      }
    });

    if (!adminMember || !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)) {
      throw new ForbiddenException('서버 관리자 또는 소유자만 멤버를 승인/거절할 수 있습니다');
    }

    // 3. 상태가 Pending인지 확인
    if (serverMember.sStatus !== 'Pending') {
      throw new ConflictException('대기 중인 멤버만 승인 또는 거절할 수 있습니다');
    }

    // 4. 상태 업데이트 (Active 또는 Inactive만 허용)
    if (!['Active', 'Inactive'].includes(updateDto.sStatus)) {
      throw new ConflictException('잘못된 상태입니다. 대기 멤버는 Active 또는 Inactive만 허용됩니다');
    }

    // 5. 상태 업데이트
    serverMember.sStatus = updateDto.sStatus;
    const updatedMember = await this.serverMemberRepository.save(serverMember);

    return {
      sStatus: updatedMember.sStatus,
      userInfo: {
        user_name: serverMember.user.userName,
        user_email: serverMember.user.userEmail,
        profile_image_path: serverMember.user.profileImagePath,
      },
    };
  }

  async updateMemberStatusByEmail(
    serverPk: number,
    userEmail: string,
    sStatus: 'Active' | 'Inactive' | 'Banned',
    adminUserPk: number
  ): Promise<PendingMemberDto> {
    // 1. userEmail로 사용자 찾기
    const user = await this.userService.findByEmailOrThrow(userEmail);

    // 2. 서버 멤버 찾기
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: user.userPk },
      relations: ['user', 'server']
    });

    if (!serverMember) {
      throw new NotFoundException(`사용자 ${userEmail}이 이 서버의 멤버가 아닙니다`);
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: adminUserPk,
        sStatus: 'Active'
      }
    });

    if (!adminMember || !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)) {
      throw new ForbiddenException('서버 관리자 또는 소유자만 멤버를 승인/거절할 수 있습니다');
    }

    // 4. 상태가 Pending인지 확인 (Banned는 예외)
    if (serverMember.sStatus !== 'Pending' && sStatus !== 'Banned') {
      throw new ConflictException('대기 중인 멤버만 승인 또는 거절할 수 있습니다');
    }

    // 5. 상태 업데이트
    serverMember.sStatus = sStatus;
    const updatedMember = await this.serverMemberRepository.save(serverMember);

    // 6. Active로 승인된 경우, 기본 "일반" 프로젝트와 채널에 자동 가입
    if (sStatus === 'Active') {
      await this.addMemberToDefaultProjectAndChannel(serverPk, user.userPk);
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
  private async addMemberToDefaultProjectAndChannel(serverPk: number, userPk: number): Promise<void> {
    // 1. 기본 "일반" 프로젝트 찾기
    const defaultProject = await this.projectRepository.findOne({
      where: {
        serverPk,
        projectName: '일반',
        isDeletedProject: false
      }
    });

    if (!defaultProject) {
      // 일반 프로젝트가 없으면 자동 가입 스킵 (에러는 던지지 않음)
      console.warn(`서버 ${serverPk}에 기본 "일반" 프로젝트가 없습니다.`);
      return;
    }

    // 2. 이미 프로젝트 멤버인지 확인
    const existingProjectMember = await this.projectMemberRepository.findOne({
      where: { projectPk: defaultProject.projectPk, userPk }
    });

    if (!existingProjectMember) {
      // 프로젝트 멤버로 추가
      const projectMember = this.projectMemberRepository.create({
        projectPk: defaultProject.projectPk,
        userPk,
        pStatus: 'Active',
        projectRole: 'member'
      });
      await this.projectMemberRepository.save(projectMember);
    }

    // 3. 일반 프로젝트의 모든 public 채널에 자동 추가
    await this.addMemberToPublicChannels(defaultProject.projectPk, userPk);
  }

  // 프로젝트의 모든 public 채널에 멤버를 추가하는 헬퍼 메서드
  private async addMemberToPublicChannels(projectPk: number, userPk: number): Promise<void> {
    // 해당 프로젝트의 모든 public 채널 조회
    const publicChannels = await this.channelRepository.find({
      where: {
        projectPk,
        isDeletedChannel: false,
        isPrivate: false
      }
    });

    if (publicChannels.length === 0) {
      console.warn(`프로젝트 ${projectPk}에 public 채널이 없습니다.`);
      return;
    }

    // 이미 가입된 채널 확인
    const existingChannelMembers = await this.channelMemberRepository.find({
      where: {
        userPk,
        channelPk: In(publicChannels.map(ch => ch.channelPk))
      }
    });

    const existingChannelPks = new Set(existingChannelMembers.map(m => m.channelPk));

    // 아직 가입되지 않은 public 채널에만 추가
    const channelMembersToAdd = publicChannels
      .filter(channel => !existingChannelPks.has(channel.channelPk))
      .map(channel =>
        this.channelMemberRepository.create({
          channelPk: channel.channelPk,
          userPk: userPk,
          cStatus: 'Active',
          channelRole: 'member',
        })
      );

    if (channelMembersToAdd.length > 0) {
      await this.channelMemberRepository.save(channelMembersToAdd);
    }
  }

  // 서버 멤버 목록 조회 (모든 상태)
  async getActiveServerMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 멤버인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active'
      }
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

    return allMembers.map(member => ({
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
  async getBannedMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active'
      }
    });

    if (!requestMember || !ServerRoleUtils.hasAdminPermission(requestMember.serverRole)) {
      throw new ForbiddenException('서버 관리자 또는 소유자만 차단된 멤버를 볼 수 있습니다');
    }

    // 3. 밴된 멤버 목록 조회
    const bannedMembers = await this.serverMemberRepository.find({
      where: { serverPk, sStatus: 'Banned' },
      relations: ['user'],
      order: { serverMemberPk: 'DESC' }, // 최근 밴된 순서
    });

    return bannedMembers.map(member => ({
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
  async unbanMember(serverMemberPk: number, adminUserPk: number): Promise<PendingMemberDto> {
    // 1. 밴된 멤버 확인
    const bannedMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk, sStatus: 'Banned' },
      relations: ['user', 'server']
    });

    if (!bannedMember) {
      throw new NotFoundException('차단된 멤버를 찾을 수 없습니다');
    }

    // 2. 관리자 권한 확인 (Owner만 언밴 가능)
    const adminMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: bannedMember.serverPk,
        userPk: adminUserPk,
        sStatus: 'Active'
      }
    });

    if (!adminMember || adminMember.serverRole !== 'owner') {
      throw new ForbiddenException('서버 소유자만 멤버의 차단을 해제할 수 있습니다');
    }

    // 3. 상태를 Active로 복구
    bannedMember.sStatus = 'Active';
    const unbannedMember = await this.serverMemberRepository.save(bannedMember);

    return {
      sStatus: unbannedMember.sStatus,
      userInfo: {
        user_name: bannedMember.user.userName,
        user_email: bannedMember.user.userEmail,
        profile_image_path: bannedMember.user.profileImagePath,
      },
    };
  }

  async banMember(serverPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. 차단할 멤버 확인 (승인된 멤버만)
    const targetMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: targetUserPk, sStatus: 'Active' }
    });

    if (!targetMember) {
      throw new NotFoundException('대상 사용자가 이 서버의 활성 멤버가 아닙니다');
    }

    // 3. ban_members 권한 확인 (DB 권한 시스템 사용)
    const hasBanPermission = await this.serverRolePermissionService.hasPermission(
      serverPk,
      adminUserPk,
      'banMembers'
    );

    if (!hasBanPermission) {
      throw new ForbiddenException('멤버 차단 권한이 없습니다');
    }

    // 요청자 정보 조회 (Owner 여부 확인용)
    const adminMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: adminUserPk, sStatus: 'Active' }
    });

    if (!adminMember) {
      throw new ForbiddenException('서버 멤버가 아닙니다');
    }

    // 4. Owner는 차단할 수 없음
    if (targetMember.serverRole === 'owner') {
      throw new ForbiddenException('서버 소유자는 차단할 수 없습니다');
    }

    // 5. Admin끼리는 차단 불가 (Owner만 Admin 차단 가능)
    if (targetMember.serverRole === 'admin' && adminMember.serverRole !== 'owner') {
      throw new ForbiddenException('서버 소유자만 관리자 멤버를 차단할 수 있습니다');
    }

    // 6. 논리적 삭제 (상태를 'Banned'로 변경)
    targetMember.sStatus = 'Banned';
    await this.serverMemberRepository.save(targetMember);
  }

  // serverUrl로 서버 멤버 목록 조회 (권한에 따라 다른 정보 반환)
  async getServerMembersByUrl(
    serverUrl: string,
    requestUserPk: number
  ): Promise<ServerMemberInfoDto[] | ServerMemberDetailDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverUrl, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다`);
    }

    // 2. 요청자의 서버 멤버 정보 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: 'Active'
      }
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
    const isAdmin = ServerRoleUtils.hasAdminPermission(requestMember.serverRole);

    if (isAdmin) {
      // Admin/Owner: 상세 정보 포함
      return allMembers.map(member => ({
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
      return allMembers.map(member => ({
        userInfo: {
          userName: member.user.userName,
          userEmail: member.user.userEmail,
          profileImagePath: member.user.profileImagePath,
        },
      }));
    }
  }
}