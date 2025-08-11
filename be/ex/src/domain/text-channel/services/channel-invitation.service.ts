import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { User } from '../../user/entities/user.entity';

export interface InviteToChannelDto {
  channelPk: number;
  userEmail: string;
  inviterUserPk: number;
  channelRole?: 'member' | 'admin';
}

export interface ChannelMemberDto {
  channelMemberPk: number;
  channelPk: number;
  userPk: number;
  cStatus: 'Active' | 'Inactive' | 'Banned';
  channelRole: 'member' | 'admin' | 'owner';
  isMute: boolean;
  lastReadMessage?: number;
  userInfo: {
    userPk: number;
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
  ) {}

  // 이메일로 채널에 사용자 초대 (직접 추가)
  async inviteUserToChannel(inviteDto: InviteToChannelDto): Promise<ChannelMemberDto> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk: inviteDto.channelPk, isDeletedChannel: false },
      relations: ['project']
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${inviteDto.channelPk} not found`);
    }

    // 2. Private 채널은 초대만 가능
    if (!channel.isPrivate) {
      throw new ForbiddenException('Public channels allow direct joining. Use join channel instead.');
    }

    // 3. 초대하려는 사용자 존재 확인 (이메일로)
    const targetUser = await this.userRepository.findOne({
      where: { userEmail: inviteDto.userEmail, isDeleted: false }
    });

    if (!targetUser) {
      throw new NotFoundException(`User with email ${inviteDto.userEmail} not found`);
    }

    // 4. 초대자가 해당 채널의 관리자인지 확인
    const inviterMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk: inviteDto.channelPk, 
        userPk: inviteDto.inviterUserPk,
        cStatus: 'Active'
      }
    });

    if (!inviterMember || !['admin', 'owner'].includes(inviterMember.channelRole)) {
      throw new ForbiddenException('Only channel admin or owner can invite users to private channels');
    }

    // 5. 초대할 사용자가 해당 프로젝트의 멤버인지 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk: channel.projectPk, 
        userPk: targetUser.userPk,
        pStatus: 'Active'
      }
    });

    if (!projectMember) {
      throw new ForbiddenException('User must be a project member to join channels');
    }

    // 6. 이미 채널 멤버인지 확인
    const existingMember = await this.channelMemberRepository.findOne({
      where: { channelPk: inviteDto.channelPk, userPk: targetUser.userPk }
    });

    if (existingMember) {
      if (existingMember.cStatus === 'Active') {
        throw new ConflictException('User is already an active member of this channel');
      } else if (existingMember.cStatus === 'Banned') {
        throw new ConflictException('User is banned from this channel');
      } else if (existingMember.cStatus === 'Inactive') {
        // 비활성 사용자를 다시 활성화
        existingMember.cStatus = 'Active';
        existingMember.channelRole = inviteDto.channelRole || 'member';
        const reactivatedMember = await this.channelMemberRepository.save(existingMember);
        
        return {
          channelMemberPk: reactivatedMember.channelMemberPk,
          channelPk: reactivatedMember.channelPk,
          userPk: reactivatedMember.userPk,
          cStatus: reactivatedMember.cStatus,
          channelRole: reactivatedMember.channelRole,
          isMute: reactivatedMember.isMute,
          lastReadMessage: reactivatedMember.lastReadMessage,
          userInfo: {
            userPk: targetUser.userPk,
            userName: targetUser.userName,
            userEmail: targetUser.userEmail,
            profileImagePath: targetUser.profileImagePath,
          },
        };
      }
    }

    // 7. 채널 멤버로 직접 추가 (Active 상태)
    const channelMember = this.channelMemberRepository.create({
      channelPk: inviteDto.channelPk,
      userPk: targetUser.userPk,
      cStatus: 'Active',
      channelRole: inviteDto.channelRole || 'member',
    });
    const savedMember = await this.channelMemberRepository.save(channelMember);

    return {
      channelMemberPk: savedMember.channelMemberPk,
      channelPk: savedMember.channelPk,
      userPk: savedMember.userPk,
      cStatus: savedMember.cStatus,
      channelRole: savedMember.channelRole,
      isMute: savedMember.isMute,
      lastReadMessage: savedMember.lastReadMessage,
      userInfo: {
        userPk: targetUser.userPk,
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
      throw new NotFoundException(`Channel with ID ${channelPk} not found`);
    }

    // 2. Public 채널인지 확인
    if (channel.isPrivate) {
      throw new ForbiddenException('Private channels require invitation');
    }

    // 3. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userPk} not found`);
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
      throw new ForbiddenException('User must be a project member to join channels');
    }

    // 5. 이미 채널 멤버인지 확인
    const existingMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk }
    });

    if (existingMember) {
      if (existingMember.cStatus === 'Active') {
        throw new ConflictException('User is already an active member of this channel');
      } else if (existingMember.cStatus === 'Banned') {
        throw new ConflictException('User is banned from this channel');
      } else if (existingMember.cStatus === 'Inactive') {
        // 비활성 사용자를 다시 활성화
        existingMember.cStatus = 'Active';
        const reactivatedMember = await this.channelMemberRepository.save(existingMember);
        
        return {
          channelMemberPk: reactivatedMember.channelMemberPk,
          channelPk: reactivatedMember.channelPk,
          userPk: reactivatedMember.userPk,
          cStatus: reactivatedMember.cStatus,
          channelRole: reactivatedMember.channelRole,
          isMute: reactivatedMember.isMute,
          lastReadMessage: reactivatedMember.lastReadMessage,
          userInfo: {
            userPk: user.userPk,
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
      channelMemberPk: savedMember.channelMemberPk,
      channelPk: savedMember.channelPk,
      userPk: savedMember.userPk,
      cStatus: savedMember.cStatus,
      channelRole: savedMember.channelRole,
      isMute: savedMember.isMute,
      lastReadMessage: savedMember.lastReadMessage,
      userInfo: {
        userPk: user.userPk,
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
      throw new NotFoundException(`Channel with ID ${channelPk} not found`);
    }

    // 2. Private 채널은 멤버만 조회 가능
    if (channel.isPrivate) {
      const requestMember = await this.channelMemberRepository.findOne({
        where: { 
          channelPk, 
          userPk: requestUserPk, 
          cStatus: 'Active'
        }
      });

      if (!requestMember) {
        throw new ForbiddenException('Only channel members can view member list of private channels');
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
        throw new ForbiddenException('Only project members can view channel member list');
      }
    }

    // 3. 활성 멤버 목록 조회
    const channelMembers = await this.channelMemberRepository.find({
      where: { channelPk, cStatus: 'Active' },
      relations: ['user'],
      order: { channelMemberPk: 'ASC' },
    });

    return channelMembers.map(member => ({
      channelMemberPk: member.channelMemberPk,
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
      throw new NotFoundException('Target user is not an active member of this channel');
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

      if (!adminMember || !['admin', 'owner'].includes(adminMember.channelRole)) {
        throw new ForbiddenException('Only channel admin or owner can remove members');
      }

      // 4. Owner는 제거할 수 없음
      if (targetMember.channelRole === 'owner') {
        throw new ForbiddenException('Cannot remove channel owner');
      }

      // 5. Admin끼리는 제거 불가 (Owner만 Admin 제거 가능)
      if (targetMember.channelRole === 'admin' && adminMember.channelRole !== 'owner') {
        throw new ForbiddenException('Only channel owner can remove admin members');
      }
    }

    // 6. 상태를 Inactive로 변경 (soft delete)
    targetMember.cStatus = 'Inactive';
    await this.channelMemberRepository.save(targetMember);
  }

  // 채널에서 사용자 차단
  async banUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
    // 1. 채널 존재 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false }
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${channelPk} not found`);
    }

    // 2. 차단할 멤버 확인
    const targetMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk: targetUserPk }
    });

    if (!targetMember || targetMember.cStatus === 'Banned') {
      throw new NotFoundException('Target user is not found or already banned');
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk, 
        userPk: adminUserPk,
        cStatus: 'Active'
      }
    });

    if (!adminMember || !['admin', 'owner'].includes(adminMember.channelRole)) {
      throw new ForbiddenException('Only channel admin or owner can ban members');
    }

    // 4. Owner는 차단할 수 없음
    if (targetMember.channelRole === 'owner') {
      throw new ForbiddenException('Cannot ban channel owner');
    }

    // 5. Admin끼리는 차단 불가 (Owner만 Admin 차단 가능)
    if (targetMember.channelRole === 'admin' && adminMember.channelRole !== 'owner') {
      throw new ForbiddenException('Only channel owner can ban admin members');
    }

    // 6. 상태를 Banned로 변경
    targetMember.cStatus = 'Banned';
    await this.channelMemberRepository.save(targetMember);
  }

  // 채널에서 차단 해제 (Owner만 가능)
  async unbanUserFromChannel(channelPk: number, targetUserPk: number, ownerUserPk: number): Promise<ChannelMemberDto> {
    // 1. 차단된 멤버 확인
    const bannedMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk: targetUserPk, cStatus: 'Banned' },
      relations: ['user']
    });

    if (!bannedMember) {
      throw new NotFoundException('Banned member not found');
    }

    // 2. Owner 권한 확인
    const ownerMember = await this.channelMemberRepository.findOne({
      where: { 
        channelPk, 
        userPk: ownerUserPk,
        cStatus: 'Active',
        channelRole: 'owner'
      }
    });

    if (!ownerMember) {
      throw new ForbiddenException('Only channel owner can unban members');
    }

    // 3. 상태를 Active로 복구
    bannedMember.cStatus = 'Active';
    const unbannedMember = await this.channelMemberRepository.save(bannedMember);

    return {
      channelMemberPk: unbannedMember.channelMemberPk,
      channelPk: unbannedMember.channelPk,
      userPk: unbannedMember.userPk,
      cStatus: unbannedMember.cStatus,
      channelRole: unbannedMember.channelRole,
      isMute: unbannedMember.isMute,
      lastReadMessage: unbannedMember.lastReadMessage,
      userInfo: {
        userPk: bannedMember.user.userPk,
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
      throw new NotFoundException(`Channel with ID ${channelPk} not found`);
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
      throw new NotFoundException('Target user is not an active member of this channel');
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

      if (!adminMember || !['admin', 'owner'].includes(adminMember.channelRole)) {
        throw new ForbiddenException('Only channel admin or owner can mute/unmute other members');
      }
    }

    // 4. 음소거 상태 토글
    targetMember.isMute = !targetMember.isMute;
    const updatedMember = await this.channelMemberRepository.save(targetMember);

    return {
      channelMemberPk: updatedMember.channelMemberPk,
      channelPk: updatedMember.channelPk,
      userPk: updatedMember.userPk,
      cStatus: updatedMember.cStatus,
      channelRole: updatedMember.channelRole,
      isMute: updatedMember.isMute,
      lastReadMessage: updatedMember.lastReadMessage,
      userInfo: {
        userPk: targetMember.user.userPk,
        userName: targetMember.user.userName,
        userEmail: targetMember.user.userEmail,
        profileImagePath: targetMember.user.profileImagePath,
      },
    };
  }
}