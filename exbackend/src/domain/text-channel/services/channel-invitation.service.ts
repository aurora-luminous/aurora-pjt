import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { MemberRoleUtils } from '../../../common/enums/member-role.enum';

export interface InviteToChannelDto {
  channelPk: number;
  userEmail: string;
  inviterUserPk: number;
  channelRole?: 'member' | 'admin';
}

export interface UserEmailDto {
  userEmail: string;
}

export interface BulkInviteToChannelDto {
  users: UserEmailDto[];
  channelPk: number;
  inviterUserPk: number;
}

export interface ChannelMemberDto {
  channelPk: number;
  cStatus: 'Active' | 'Inactive' | 'Banned';
  channelRole: 'member' | 'admin';
  isMute: boolean;
  lastReadMessage?: number;
  userInfo: {
    userName: string;
    userEmail: string;
    profileImagePath: string;
  };
}

export interface RemoveFromChannelDto {
  channelPk: number;
  targetUserPk: number;
  adminUserPk: number;
}

@Injectable()
export class ChannelInvitationService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  // 이메일로 채널에 사용자 초대 (직접 추가)
  async inviteUserToChannel(inviteDto: InviteToChannelDto): Promise<ChannelMemberDto> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk: inviteDto.channelPk, isDeletedChannel: false },
      relations: ['project']
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${inviteDto.channelPk}를 찾을 수 없습니다`);
    }

    // 2. 초대하려는 사용자 존재 확인 (이메일로)
    const targetUser = await this.userService.findByEmailOrThrow(inviteDto.userEmail);

    // 3. 초대하는 사용자가 해당 채널에 다른 사용자를 초대할 권한이 있는지 확인
    // Private 채널: 채널 관리자만 초대 가능
    // Public 채널: 프로젝트 멤버라면 누구나 초대 가능 (혹은 프로젝트 관리자만?)
    if (channel.accessType === 'PRIVATE') {
      const inviterMember = await this.channelMemberRepository.findOne({
        where: { 
          channelPk: inviteDto.channelPk, 
          userPk: inviteDto.inviterUserPk,
          cStatus: 'Active'
        }
      });
      if (!inviterMember || !MemberRoleUtils.hasAdminPermission(inviterMember.channelRole)) {
        throw new ForbiddenException('비공개 채널은 채널 관리자 또는 소유자만 사용자를 초대할 수 있습니다');
      }
    } else { // Public 채널
      // Public 채널은 해당 프로젝트의 멤버면 누구나 초대 가능하도록 (혹은 프로젝트 관리자만?)
      const projectMember = await this.projectMemberRepository.findOne({
        where: {
          projectPk: channel.projectPk,
          userPk: inviteDto.inviterUserPk,
          pStatus: 'Active'
        }
      });
      if (!projectMember) {
        throw new ForbiddenException('공개 채널에 다른 사용자를 초대하려면 먼저 프로젝트의 멤버여야 합니다.');
      }
    }

    // 4. 초대할 사용자가 해당 프로젝트의 멤버인지 확인
    const targetProjectMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk: channel.projectPk, 
        userPk: targetUser.userPk,
        pStatus: 'Active'
      }
    });

    if (!targetProjectMember) {
      throw new ForbiddenException('채널에 참가하려면 프로젝트 멤버여야 합니다');
    }

    // 5. 이미 채널 멤버인지 확인
    const existingMember = await this.channelMemberRepository.findOne({
      where: { channelPk: inviteDto.channelPk, userPk: targetUser.userPk }
    });

    if (existingMember) {
      if (existingMember.cStatus === 'Active') {
        throw new ConflictException('사용자가 이미 이 채널의 활성 멤버입니다');
      } else if (existingMember.cStatus === 'Banned') {
        throw new ConflictException('사용자가 이 채널에서 차단되었습니다');
      } else if (existingMember.cStatus === 'Inactive') {
        // 비활성 사용자를 다시 활성화
        existingMember.cStatus = 'Active';
        existingMember.channelRole = inviteDto.channelRole || 'member';
        const reactivatedMember = await this.channelMemberRepository.save(existingMember);
        
        return {
          channelPk: reactivatedMember.channelPk,
          cStatus: reactivatedMember.cStatus,
          channelRole: reactivatedMember.channelRole,
          isMute: reactivatedMember.isMute,
          lastReadMessage: reactivatedMember.lastReadMessage,
          userInfo: {
            userName: targetUser.userName,
            userEmail: targetUser.userEmail,
            profileImagePath: targetUser.profileImagePath,
          },
        };
      }
    }

    // 6. 채널 멤버로 직접 추가 (Active 상태)
    const channelMember = this.channelMemberRepository.create({
      channelPk: inviteDto.channelPk,
      userPk: targetUser.userPk,
      cStatus: 'Active',
      channelRole: inviteDto.channelRole || 'member',
    });
    const savedMember = await this.channelMemberRepository.save(channelMember);

    return {
      channelPk: savedMember.channelPk,
      cStatus: savedMember.cStatus,
      channelRole: savedMember.channelRole,
      isMute: savedMember.isMute,
      lastReadMessage: savedMember.lastReadMessage,
      userInfo: {
        userName: targetUser.userName,
        userEmail: targetUser.userEmail,
        profileImagePath: targetUser.profileImagePath,
      },
    };
  }

  // Public 채널에 직접 참가
  async joinPublicChannel(channelPk: number, userPk: number): Promise<ChannelMemberDto> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false },
      relations: ['project']
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다`);
    }

    // 2. Public 채널인지 확인 (accessType이 PRIVATE인 경우 초대가 필요)
    if (channel.accessType === 'PRIVATE') {
      throw new ForbiddenException('비공개 채널은 초대가 필요합니다');
    }

    // 3. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException(`사용자 ID ${userPk}를 찾을 수 없습니다`);
    }

    // 4. 사용자가 해당 프로젝트의 멤버인지 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk: channel.projectPk, 
        userPk,
        pStatus: 'Active'
      }
    });

    if (!projectMember) {
      throw new ForbiddenException('채널에 참가하려면 프로젝트 멤버여야 합니다');
    }

    // 5. 이미 채널 멤버인지 확인
    const existingMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk }
    });

    if (existingMember) {
      if (existingMember.cStatus === 'Active') {
        throw new ConflictException('사용자가 이미 이 채널의 활성 멤버입니다');
      } else if (existingMember.cStatus === 'Banned') {
        throw new ConflictException('사용자가 이 채널에서 차단되었습니다');
      } else if (existingMember.cStatus === 'Inactive') {
        // 비활성 사용자를 다시 활성화
        existingMember.cStatus = 'Active';
        const reactivatedMember = await this.channelMemberRepository.save(existingMember);
        
        return {
          channelPk: reactivatedMember.channelPk,
          cStatus: reactivatedMember.cStatus,
          channelRole: reactivatedMember.channelRole,
          isMute: reactivatedMember.isMute,
          lastReadMessage: reactivatedMember.lastReadMessage,
          userInfo: {
            userName: user.userName,
            userEmail: user.userEmail,
            profileImagePath: user.profileImagePath,
          },
        };
      }
    }

    // 6. 채널 멤버로 추가 (기본 member 권한)
    const channelMember = this.channelMemberRepository.create({
      channelPk,
      userPk,
      cStatus: 'Active',
      channelRole: 'member',
    });
    const savedMember = await this.channelMemberRepository.save(channelMember);

    return {
      channelPk: savedMember.channelPk,
      cStatus: savedMember.cStatus,
      channelRole: savedMember.channelRole,
      isMute: savedMember.isMute,
      lastReadMessage: savedMember.lastReadMessage,
      userInfo: {
        userName: user.userName,
        userEmail: user.userEmail,
        profileImagePath: user.profileImagePath,
      },
    };
  }

  // 채널 멤버 목록 조회
  async getChannelMembers(channelPk: number, requestUserPk: number): Promise<ChannelMemberDto[]> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false }
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다`);
    }

    // 2. Private 채널은 멤버만 조회 가능 (accessType이 PRIVATE인 경우)
    if (channel.accessType === 'PRIVATE') {
      const requestMember = await this.channelMemberRepository.findOne({
        where: { 
          channelPk, 
          userPk: requestUserPk, 
          cStatus: 'Active'
        }
      });

      if (!requestMember) {
        throw new ForbiddenException('채널 멤버만 비공개 채널의 멤버 목록을 볼 수 있습니다');
      }
    } else {
      // Public 채널은 프로젝트 멤버면 조회 가능
      const projectMember = await this.projectMemberRepository.findOne({
        where: { 
          projectPk: channel.projectPk, 
          userPk: requestUserPk,
          pStatus: 'Active'
        }
      });

      if (!projectMember) {
        throw new ForbiddenException('프로젝트 멤버만 채널 멤버 목록을 보수 있습니다');
      }
    }

    // 3. 모든 멤버 목록 조회 (모든 상태)
    const channelMembers = await this.channelMemberRepository.find({
      where: { channelPk },
      relations: ['user'],
      order: { channelMemberPk: 'ASC' },
    });

    return channelMembers.map(member => ({
      channelPk: member.channelPk,
      userPk: member.userPk,
      cStatus: member.cStatus,
      channelRole: member.channelRole,
      isMute: member.isMute,
      lastReadMessage: member.lastReadMessage,
      userInfo: {
        userPk: member.user.userPk,
        userName: member.user.userName,
        userEmail: member.user.userEmail,
        profileImagePath: member.user.profileImagePath,
      },
    }));
  }

  // 채널에서 사용자 제거/퇴장
  async removeUserFromChannel(removeDto: RemoveFromChannelDto): Promise<void> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk: removeDto.channelPk, isDeletedChannel: false }
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${removeDto.channelPk} not found`);
    }

    // 2. 제거할 멤버 확인
    const targetMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk: removeDto.channelPk, 
        userPk: removeDto.targetUserPk,
        cStatus: 'Active'
      }
    });

    if (!targetMember) {
      throw new NotFoundException('대상 사용자가 이 채널의 활성 멤버가 아닙니다');
    }

    // 3. 관리자 권한 확인 (자기 자신은 언제든 나갈 수 있음)
    if (removeDto.adminUserPk !== removeDto.targetUserPk) {
      const adminMember = await this.channelMemberRepository.findOne({
        where: { 
          channelPk: removeDto.channelPk, 
          userPk: removeDto.adminUserPk,
          cStatus: 'Active'
        }
      });

      if (!adminMember || !MemberRoleUtils.hasAdminPermission(adminMember.channelRole)) {
        throw new ForbiddenException('채널 관리자 또는 소유자만 멤버를 제거할 수 있습니다');
      }

      // 4. Admin끼리는 제거 불가
      if (targetMember.channelRole === 'admin') {
        throw new ForbiddenException('관리자 멤버는 제거할 수 없습니다');
      }
    }

    // 6. 상태를 Inactive로 변경 (soft delete)
    await this._updateChannelMemberStatus(targetMember.channelMemberPk, 'Inactive');
  }

  // 채널에서 사용자 차단
  async banUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false }
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다`);
    }

    // 2. 차단할 멤버 확인
    const targetMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk: targetUserPk }
    });

    if (!targetMember || targetMember.cStatus === 'Banned') {
      throw new NotFoundException('대상 사용자를 찾을 수 없거나 이미 차단된 상태입니다');
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk, 
        userPk: adminUserPk,
        cStatus: 'Active'
      }
    });

    if (!adminMember || !MemberRoleUtils.hasAdminPermission(adminMember.channelRole)) {
      throw new ForbiddenException('채널 관리자 또는 소유자만 멤버를 차단할 수 있습니다');
    }

    // 4. Admin끼리는 차단 불가
    if (targetMember.channelRole === 'admin') {
      throw new ForbiddenException('관리자 멤버는 차단할 수 없습니다');
    }

    // 6. 상태를 Banned로 변경
    await this._updateChannelMemberStatus(targetMember.channelMemberPk, 'Banned');
  }

  // 채널에서 차단 해제 (Admin만 가능)
  async unbanUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<ChannelMemberDto> {
    // 1. 차단된 멤버 확인
    const bannedMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk: targetUserPk, cStatus: 'Banned' },
      relations: ['user']
    });

    if (!bannedMember) {
      throw new NotFoundException('차단된 멤버를 찾을 수 없습니다');
    }

    // 2. Admin 권한 확인
    const adminMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk, 
        userPk: adminUserPk,
        cStatus: 'Active'
      }
    });

    if (!adminMember || !MemberRoleUtils.hasAdminPermission(adminMember.channelRole)) {
      throw new ForbiddenException('채널 관리자만 멤버의 차단을 해제할 수 있습니다');
    }

    // 3. 상태를 Active로 복구
    bannedMember.cStatus = 'Active';
    const unbannedMember = await this.channelMemberRepository.save(bannedMember);

    return {
      channelPk: unbannedMember.channelPk,
      cStatus: unbannedMember.cStatus,
      channelRole: unbannedMember.channelRole,
      isMute: unbannedMember.isMute,
      lastReadMessage: unbannedMember.lastReadMessage,
      userInfo: {
        userName: bannedMember.user.userName,
        userEmail: bannedMember.user.userEmail,
        profileImagePath: bannedMember.user.profileImagePath,
      },
    };
  }

  // 사용자 음소거/음소거 해제
  async toggleUserMute(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<ChannelMemberDto> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false }
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다`);
    }

    // 2. 대상 멤버 확인
    const targetMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk, 
        userPk: targetUserPk,
        cStatus: 'Active'
      },
      relations: ['user']
    });

    if (!targetMember) {
      throw new NotFoundException('대상 사용자가 이 채널의 활성 멤버가 아닙니다');
    }

    // 3. 본인 음소거는 본인만, 타인 음소거는 관리자만
    if (adminUserPk !== targetUserPk) {
      const adminMember = await this.channelMemberRepository.findOne({
        where: { 
          channelPk, 
          userPk: adminUserPk,
          cStatus: 'Active'
        }
      });

      if (!adminMember || !MemberRoleUtils.hasAdminPermission(adminMember.channelRole)) {
        throw new ForbiddenException('채널 관리자 또는 소유자만 다른 멤버를 음소거/음소거 해제할 수 있습니다');
      }
    }

    // 4. 음소거 상태 토글
    targetMember.isMute = !targetMember.isMute;
    const updatedMember = await this.channelMemberRepository.save(targetMember);

    return {
      channelPk: updatedMember.channelPk,
      cStatus: updatedMember.cStatus,
      channelRole: updatedMember.channelRole,
      isMute: updatedMember.isMute,
      lastReadMessage: updatedMember.lastReadMessage,
      userInfo: {
        userName: targetMember.user.userName,
        userEmail: targetMember.user.userEmail,
        profileImagePath: targetMember.user.profileImagePath,
      },
    };
  }

  // 여러 사용자를 채널에 일괄 초대 (Private 채널만)
  async bulkInviteUsersToChannel(bulkInviteDto: BulkInviteToChannelDto): Promise<void> {
    for (const userEmail of bulkInviteDto.users) {
      try {
        const inviteDto: InviteToChannelDto = {
          channelPk: bulkInviteDto.channelPk,
          userEmail: userEmail.userEmail,
          inviterUserPk: bulkInviteDto.inviterUserPk,
          channelRole: 'member' // 기본 역할
        };
        
        await this.inviteUserToChannel(inviteDto);
      } catch (error) {
        // 개별 초대 실패 시 로그만 남기고 계속 진행
        console.error(`Failed to invite ${userEmail.userEmail} to channel:`, error.message);
      }
    }
  }

  // === 이메일 기반 메서드들 ===

  async removeUserFromChannelByEmail(
    channelPk: number,
    targetUserEmail: string,
    adminUserPk: number
  ): Promise<void> {
    // 이메일로 사용자 찾기
    const targetUser = await this.userService.findByEmailOrThrow(targetUserEmail);

    const removeDto: RemoveFromChannelDto = {
      channelPk,
      targetUserPk: targetUser.userPk,
      adminUserPk
    };

    return this.removeUserFromChannel(removeDto);
  }

  async banUserFromChannelByEmail(
    channelPk: number,
    targetUserEmail: string,
    adminUserPk: number
  ): Promise<{ message: string }> {
    // 이메일로 사용자 찾기
    const targetUser = await this.userService.findByEmailOrThrow(targetUserEmail);

    await this.banUserFromChannel(channelPk, targetUser.userPk, adminUserPk);
    return { message: '사용자가 차단되었습니다.' };
  }

  async unbanUserFromChannelByEmail(
    channelPk: number,
    userEmail: string,
    ownerUserPk: number
  ): Promise<void> {
    // 이메일로 사용자 찾기
    const targetUser = await this.userService.findByEmailOrThrow(userEmail);

    await this.unbanUserFromChannel(channelPk, targetUser.userPk, ownerUserPk);
  }

  // 채널 나가기 (사용자 본인)
  async leaveChannel(channelPk: number, userPk: number): Promise<{ message: string }> {
    // 1. 채널 존재 확인 (선택 사항 - 이미 removeUserFromChannel에서 확인)
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false }
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 채널 멤버인지 확인
    const channelMember = await this.channelMemberRepository.findOne({
      where: {
        channelPk,
        userPk,
        cStatus: 'Active'
      },
      relations: ['user'] // 알림을 위해 user 정보 로드
    });

    if (!channelMember) {
      throw new NotFoundException('채널의 활성 멤버가 아닙니다');
    }

    // 3. 상태를 Inactive로 변경 (soft delete)
    await this._updateChannelMemberStatus(channelMember.channelMemberPk, 'Inactive');

    // TODO: Spring 서버로 멤버 제거 알림 전송 (필요하다면)

    return { message: '채널에서 나갔습니다' };
  }

  private async _updateChannelMemberStatus(
    channelMemberPk: number,
    newStatus: 'Active' | 'Inactive' | 'Banned',
  ): Promise<void> {
    const channelMember = await this.channelMemberRepository.findOne({
      where: { channelMemberPk },
    });

    if (!channelMember) {
      throw new NotFoundException(`채널 멤버 ${channelMemberPk} 를 찾을 수 없습니다.`);
    }

    channelMember.cStatus = newStatus;
    await this.channelMemberRepository.save(channelMember);
  }
}