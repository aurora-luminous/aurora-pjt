import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { Server } from '../../server/entities/server.entity';
import { ServerMember } from '../../server/entities/server-member.entity';
import { Channel } from '../../text-channel/entities/channel.entity';
import { ChannelMember } from '../../text-channel/entities/channel-member.entity';
import { MemberRoleUtils, ServerRoleUtils } from '../../../common/enums/member-role.enum';
import { ProjectNotificationService } from './project-notification.service';
import {
  InviteToProjectDto,
  UserEmailDto,
  BulkInviteToProjectDto,
  ProjectMemberDto,
  RemoveFromProjectDto
} from '../dto';

@Injectable()
export class ProjectInvitationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    private readonly projectNotificationService: ProjectNotificationService, // 알림 서비스 추가
  ) {}

  // 계층적 권한 확인 헬퍼 메서드 (서버 권한 > 프로젝트 권한)
  private async hasProjectManagePermission(
    projectPk: number,
    serverPk: number,
    userPk: number
  ): Promise<boolean> {
    // 1. 프로젝트 관리자 권한 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk, pStatus: 'Active' }
    });

    if (projectMember && MemberRoleUtils.hasAdminPermission(projectMember.projectRole)) {
      return true;
    }

    // 2. 서버 상위 권한 확인 (owner, admin, projectManager)
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk, sStatus: 'Active' }
    });

    return serverMember ? ServerRoleUtils.hasProjectCreatePermission(serverMember.serverRole) : false;
  }

  // 이메일로 프로젝트에 사용자 초대 (직접 추가)
  async inviteUserToProject(inviteDto: InviteToProjectDto): Promise<ProjectMemberDto> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk: inviteDto.projectPk, isDeletedProject: false },
      relations: ['server']
    });

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${inviteDto.projectPk}를 찾을 수 없습니다`);
    }

    // 2. 초대하려는 사용자 존재 확인 (이메일로)
    const targetUser = await this.userService.findByEmailOrThrow(inviteDto.userEmail);

    // 3. 초대자 권한 확인 (계층적 권한 시스템)
    const hasPermission = await this.hasProjectManagePermission(
      inviteDto.projectPk,
      project.serverPk,
      inviteDto.inviterUserPk
    );

    if (!hasPermission) {
      throw new ForbiddenException('프로젝트 관리자 또는 서버 관리자/소유자/프로젝트 매니저만 사용자를 초대할 수 있습니다');
    }

    // 4. 초대할 사용자가 해당 서버의 멤버인지 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: project.serverPk,
        userPk: targetUser.userPk,
        sStatus: 'Active'
      }
    });

    if (!serverMember) {
      throw new ForbiddenException('프로젝트에 참가하려면 서버 멤버여야 합니다');
    }

    // 5. 이미 프로젝트 멤버인지 확인
    const existingMember = await this.projectMemberRepository.findOne({
      where: { projectPk: inviteDto.projectPk, userPk: targetUser.userPk }
    });

    if (existingMember) {
      if (existingMember.pStatus === 'Active') {
        throw new ConflictException('사용자가 이미 이 프로젝트의 활성 멤버입니다');
      } else if (existingMember.pStatus === 'Banned') {
        throw new ConflictException('사용자가 이 프로젝트에서 차단되었습니다');
      } else if (existingMember.pStatus === 'Inactive') {
        // 비활성 사용자를 다시 활성화
        existingMember.pStatus = 'Active';
        existingMember.projectRole = inviteDto.projectRole || 'member';
        const reactivatedMember = await this.projectMemberRepository.save(existingMember);

        // 재활성화된 멤버를 모든 public 채널에 추가
        await this.addMemberToPublicChannels(inviteDto.projectPk, targetUser.userPk);

        // 알림 전송 (재활성화)
        await this.projectNotificationService.notifyMemberAdded(
          inviteDto.projectPk,
          targetUser.userPk,
          targetUser.userName,
          reactivatedMember.projectRole
        );

        return {
          projectPk: reactivatedMember.projectPk,
          pStatus: reactivatedMember.pStatus,
          projectRole: reactivatedMember.projectRole,
          userInfo: {
            userName: targetUser.userName,
            userEmail: targetUser.userEmail,
            profileImagePath: targetUser.profileImagePath,
          },
        };
      }
    }

    // 6. 프로젝트 멤버로 직접 추가 (Active 상태)
    const projectMember = this.projectMemberRepository.create({
      projectPk: inviteDto.projectPk,
      userPk: targetUser.userPk,
      pStatus: 'Active',
      projectRole: inviteDto.projectRole || 'member',
    });
    const savedMember = await this.projectMemberRepository.save(projectMember);

    // 7. Spring 서버로 멤버 추가 알림 전송
    await this.projectNotificationService.notifyMemberAdded(
      inviteDto.projectPk,
      targetUser.userPk,
      targetUser.userName,
      savedMember.projectRole
    );

    // 8. 새 멤버를 모든 public 채널에 자동 추가
    await this.addMemberToPublicChannels(inviteDto.projectPk, targetUser.userPk);

    return {
      projectPk: savedMember.projectPk,
      pStatus: savedMember.pStatus,
      projectRole: savedMember.projectRole,
      userInfo: {
        userName: targetUser.userName,
        userEmail: targetUser.userEmail,
        profileImagePath: targetUser.profileImagePath,
      },
    };
  }

  // 여러 사용자를 프로젝트에 일괄 초대
  async bulkInviteUsersToProject(bulkInviteDto: BulkInviteToProjectDto): Promise<void> {
    for (const userEmail of bulkInviteDto.users) {
      try {
        const inviteDto: InviteToProjectDto = {
          projectPk: bulkInviteDto.projectPk,
          userEmail: userEmail.userEmail,
          inviterUserPk: bulkInviteDto.inviterUserPk,
          projectRole: 'member' // 기본 역할
        };

        await this.inviteUserToProject(inviteDto);
      } catch (error) {
        // 개별 초대 실패 시 로그만 남기고 계속 진행
        console.error(`Failed to invite ${userEmail.userEmail}:`, error.message);
      }
    }
  }

  // 프로젝트 멤버 목록 조회
  async getProjectMembers(projectPk: number, requestUserPk: number): Promise<ProjectMemberDto[]> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false }
    });

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자 권한 확인 (계층적 권한 시스템)
    const hasPermission = await this.hasProjectManagePermission(
      projectPk,
      project.serverPk,
      requestUserPk
    );

    // 프로젝트 멤버이거나 서버 상위 권한이 있어야 멤버 목록 조회 가능
    const requestMember = await this.projectMemberRepository.findOne({
      where: {
        projectPk,
        userPk: requestUserPk,
        pStatus: 'Active'
      }
    });

    if (!requestMember && !hasPermission) {
      throw new ForbiddenException('프로젝트 멤버 또는 서버 관리자/소유자/프로젝트 매니저만 멤버 목록을 볼 수 있습니다');
    }

    // 3. 모든 멤버 목록 조회 (모든 상태)
    const projectMembers = await this.projectMemberRepository.find({
      where: { projectPk },
      relations: ['user'],
      order: { projectMemberPk: 'ASC' },
    });

    return projectMembers.map(member => ({
      projectPk: member.projectPk,
      pStatus: member.pStatus,
      projectRole: member.projectRole,
      userInfo: {
        userName: member.user.userName,
        userEmail: member.user.userEmail,
        profileImagePath: member.user.profileImagePath,
      },
    }));
  }

  // 프로젝트에서 사용자 제거/추방
  async removeUserFromProject(removeDto: RemoveFromProjectDto): Promise<void> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk: removeDto.projectPk, isDeletedProject: false }
    });

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${removeDto.projectPk}를 찾을 수 없습니다`);
    }

    // 2. 제거할 멤버 확인
    const targetMember = await this.projectMemberRepository.findOne({
      where: {
        projectPk: removeDto.projectPk,
        userPk: removeDto.targetUserPk,
        pStatus: 'Active'
      },
      relations: ['user']
    });

    if (!targetMember) {
      throw new NotFoundException('대상 사용자가 이 프로젝트의 활성 멤버가 아닙니다');
    }

    // 3. 관리자 권한 확인 (계층적 권한 시스템)
    const hasPermission = await this.hasProjectManagePermission(
      removeDto.projectPk,
      project.serverPk,
      removeDto.adminUserPk
    );

    if (!hasPermission) {
      throw new ForbiddenException('프로젝트 관리자 또는 서버 관리자/소유자/프로젝트 매니저만 멤버를 제거할 수 있습니다');
    }

    // 4. Admin끼리는 제거 불가
    if (targetMember.projectRole === 'admin') {
      throw new ForbiddenException('관리자 멤버는 제거할 수 없습니다');
    }

    // 5. 상태를 Inactive로 변경 (soft delete)
    targetMember.pStatus = 'Inactive';
    await this.projectMemberRepository.save(targetMember);

    // 6. Spring 서버로 멤버 제거 알림 전송
    await this.projectNotificationService.notifyMemberRemoved(
      removeDto.projectPk,
      removeDto.targetUserPk,
      targetMember.user.userName,
      targetMember.projectRole
    );
  }

  // 프로젝트에서 사용자 차단
  async banUserFromProject(projectPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false }
    });

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다`);
    }

    // 2. 차단할 멤버 확인
    const targetMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: targetUserPk },
      relations: ['user']
    });

    if (!targetMember || targetMember.pStatus === 'Banned') {
      throw new NotFoundException('대상 사용자를 찾을 수 없거나 이미 차단된 상태입니다');
    }

    // 3. 관리자 권한 확인 (계층적 권한 시스템)
    const hasPermission = await this.hasProjectManagePermission(
      projectPk,
      project.serverPk,
      adminUserPk
    );

    if (!hasPermission) {
      throw new ForbiddenException('프로젝트 관리자 또는 서버 관리자/소유자/프로젝트 매니저만 멤버를 차단할 수 있습니다');
    }

    // 4. Admin끼리는 차단 불가
    if (targetMember.projectRole === 'admin') {
      throw new ForbiddenException('관리자 멤버는 차단할 수 없습니다');
    }

    // 5. 상태를 Banned로 변경
    targetMember.pStatus = 'Banned';
    await this.projectMemberRepository.save(targetMember);

    // 6. Spring 서버로 멤버 제거 알림 전송 (밴도 제거로 간주)
    await this.projectNotificationService.notifyMemberRemoved(
      projectPk,
      targetUserPk,
      targetMember.user.userName,
      targetMember.projectRole
    );
  }

  // 프로젝트에서 차단 해제 (Admin만 가능)
  async unbanUserFromProject(projectPk: number, targetUserPk: number, adminUserPk: number): Promise<ProjectMemberDto> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false }
    });

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다`);
    }

    // 2. 차단된 멤버 확인
    const bannedMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: targetUserPk, pStatus: 'Banned' },
      relations: ['user']
    });

    if (!bannedMember) {
      throw new NotFoundException('차단된 멤버를 찾을 수 없습니다');
    }

    // 3. Admin 권한 확인 (계층적 권한 시스템)
    const hasPermission = await this.hasProjectManagePermission(
      projectPk,
      project.serverPk,
      adminUserPk
    );

    if (!hasPermission) {
      throw new ForbiddenException('프로젝트 관리자 또는 서버 관리자/소유자/프로젝트 매니저만 멤버의 차단을 해제할 수 있습니다');
    }

    // 4. 상태를 Active로 복구
    bannedMember.pStatus = 'Active';
    const unbannedMember = await this.projectMemberRepository.save(bannedMember);

    // 5. 차단 해제된 멤버를 모든 public 채널에 추가
    await this.addMemberToPublicChannels(projectPk, targetUserPk);

    // 6. Spring 서버로 멤버 추가 알림 전송 (언밴도 추가로 간주)
    await this.projectNotificationService.notifyMemberAdded(
      projectPk,
      targetUserPk,
      bannedMember.user.userName,
      unbannedMember.projectRole
    );

    return {
      projectPk: unbannedMember.projectPk,
      pStatus: unbannedMember.pStatus,
      projectRole: unbannedMember.projectRole,
      userInfo: {
        userName: bannedMember.user.userName,
        userEmail: bannedMember.user.userEmail,
        profileImagePath: bannedMember.user.profileImagePath,
      },
    };
  }

  // 새 멤버를 모든 public 채널에 추가하는 헬퍼 메서드
  private async addMemberToPublicChannels(projectPk: number, userPk: number): Promise<void> {
    // 해당 프로젝트의 모든 public 채널 조회
    const publicChannels = await this.channelRepository.find({
      where: {
        projectPk,
        isDeletedChannel: false,
        accessType: 'PUBLIC' // isPrivate 대신 accessType 사용
      }
    });

    if (publicChannels.length === 0) {
      return; // public 채널이 없으면 종료
    }

    // 각 public 채널에 멤버로 추가
    const channelMembersToAdd = publicChannels.map(channel =>
      this.channelMemberRepository.create({
        channelPk: channel.channelPk,
        userPk: userPk,
        cStatus: 'Active',
        channelRole: 'member',
      })
    );

    await this.channelMemberRepository.save(channelMembersToAdd);
  }

  // === 이메일 기반 메서드들 ===

  async removeUserFromProjectByEmail(
    projectPk: number,
    targetUserEmail: string,
    adminUserPk: number
  ): Promise<void> {
    // 이메일로 사용자 찾기
    const targetUser = await this.userService.findByEmailOrThrow(targetUserEmail);

    const removeDto: RemoveFromProjectDto = {
      projectPk,
      targetUserPk: targetUser.userPk,
      adminUserPk
    };

    return this.removeUserFromProject(removeDto);
  }

  async banUserFromProjectByEmail(
    projectPk: number,
    targetUserEmail: string,
    adminUserPk: number
  ): Promise<{ message: string }> {
    // 이메일로 사용자 찾기
    const targetUser = await this.userService.findByEmailOrThrow(targetUserEmail);

    await this.banUserFromProject(projectPk, targetUser.userPk, adminUserPk);
    return { message: '사용자가 차단되었습니다.' };
  }

  async unbanUserFromProjectByEmail(
    projectPk: number,
    targetUserEmail: string,
    adminUserPk: number
  ): Promise<void> {
    // 이메일로 사용자 찾기
    const targetUser = await this.userService.findByEmailOrThrow(targetUserEmail);

    await this.unbanUserFromProject(projectPk, targetUser.userPk, adminUserPk);
  }

  // 프로젝트 나가기 로직 (일반 멤버 + PM 특별 로직)
  async leaveProject(
    projectPk: number,
    userPk: number
  ): Promise<{ message: string }> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false },
      relations: ['server']
    });

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 프로젝트 멤버인지 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: {
        projectPk,
        userPk,
        pStatus: 'Active'
      },
      relations: ['user']
    });

    if (!projectMember) {
      throw new NotFoundException('프로젝트의 활성 멤버가 아닙니다');
    }

    // 3. 서버에서의 역할 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: project.serverPk,
        userPk,
        sStatus: 'Active'
      }
    });

    // 4. PM 나가기 특별 로직 (프로젝트 admin && 서버 projectManager)
    if (projectMember.projectRole === 'admin' &&
        serverMember?.serverRole === 'projectManager') {

      // 다른 프로젝트 Admin이 있는지 확인
      const allAdmins = await this.projectMemberRepository.find({
        where: {
          projectPk,
          projectRole: 'admin',
          pStatus: 'Active'
        }
      });

      const otherActiveAdmins = allAdmins.filter(admin => admin.userPk !== userPk);

      if (otherActiveAdmins.length === 0) {
        // 마지막 PM인 경우 - 다른 멤버들이 있으면 나갈 수 없음
        const allMembers = await this.projectMemberRepository.find({
          where: {
            projectPk,
            pStatus: 'Active'
          }
        });

        const membersToKickCount = allMembers.filter(member =>
          member.userPk !== userPk &&
          member.projectRole === 'member'
        ).length;

        if (membersToKickCount > 0) {
          throw new ForbiddenException(
            `마지막 프로젝트 관리자(PM)는 프로젝트를 나가기 전에 ${membersToKickCount}명의 멤버를 모두 강퇴해야 합니다. 먼저 멤버 관리에서 다른 멤버들을 강퇴한 후 다시 시도하세요.`
          );
        }
      }
    }

    // 5. 프로젝트에서 나가기 (일반 로직)
    projectMember.pStatus = 'Inactive';
    await this.projectMemberRepository.save(projectMember);

    // Spring 서버로 멤버 제거 알림 전송
    await this.projectNotificationService.notifyMemberRemoved(
      projectPk,
      userPk,
      projectMember.user?.userName || 'Unknown',
      projectMember.projectRole
    );

    return {
      message: '프로젝트에서 나갔습니다'
    };
  }
}