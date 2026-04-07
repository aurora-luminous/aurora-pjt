import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ProjectMemberService } from '../project-member.service';
import { ProjectRepository } from '../../repositories/project.repository';
import { ProjectMemberRepository } from '../../repositories/project-member.repository';
import { ChannelRepository } from 'src/domain/channel/repositories/channel.repository';
import { ChannelMemberRepository } from 'src/domain/channel/repositories/channel-member.repository';
import { UserService } from '../../../user/services/user.service';
import { InviteToProjectDto, ProjectMemberDto, ManageMemberDto, LastChannelDto, BulkInviteToProjectDto } from '../../dto';
import { ChannelMember } from '../../../channel/entities/channel-member.entity';
import { MemberStatus, MemberRole, ServerRoleUtils, MemberRoleUtils } from 'src/common/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerMember } from '../../../server/entities/server-member.entity';


@Injectable()
export class ProjectMemberServiceImpl extends ProjectMemberService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly channelMemberRepository: ChannelMemberRepository,
    private readonly userService: UserService,

    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
  ) {
    super();
  }

  // 프로젝트에 멤버 초대
  async inviteMember(dto: InviteToProjectDto): Promise<void> {
    // 프로젝트 확인
    const project = await this.projectRepository.findOne({ projectPk: dto.projectPk, isDeletedProject: false });

    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    // 권한 확인
    const hasPermission = await this._hasProjectManagePermission(dto.projectPk, project.serverPk, dto.inviterUserPk);
    if (!hasPermission) throw new ForbiddenException('멤버를 초대할 권한이 없습니다.');

    // 초대할 사용자 Pk 받아오기
    const targetUser = await this.userService.getUserByEmail(dto.userEmail);
    
    // 서버 멤버인지 확인
    const serverMember = await this.serverMemberRepository.findOne({ 
      where: { serverPk: project.serverPk, userPk: targetUser.userPk, sStatus: MemberStatus.ACTIVE } 
    });
    if (!serverMember) throw new ForbiddenException('서버 멤버만 프로젝트에 초대할 수 있습니다.');

    // 이미 프로젝트 멤버인지 확인
    const existingMember = await this.projectMemberRepository.findOne({ projectPk: dto.projectPk, userPk: targetUser.userPk });

    if (existingMember) {
      if (existingMember.pStatus === MemberStatus.ACTIVE) throw new ConflictException('이미 프로젝트 멤버입니다.');
      if (existingMember.pStatus === MemberStatus.BANNED) throw new ConflictException('차단된 사용자입니다.');
      
      // 멤버였던 적이 있다면 나간 상태를 들어온 상태로 변경
      existingMember.pStatus = MemberStatus.ACTIVE;
      existingMember.projectRole = dto.projectRole || MemberRole.MEMBER;
      await this.projectMemberRepository.save(existingMember);
    } else {
      await this.projectMemberRepository.save({
        projectPk: dto.projectPk,
        userPk: targetUser.userPk,
        pStatus: MemberStatus.ACTIVE,
        projectRole: dto.projectRole || MemberRole.MEMBER,
      });
    }

    // 해당 유저를 공개 채널에 자동으로 멤버로 등록
    await this._addAllPublicChannels(dto.projectPk, targetUser.userPk);
  }

  // 여러명 초대
  async inviteMembers(dto: BulkInviteToProjectDto): Promise<{ message: string }> {
    const { users, projectPk, inviterUserPk } = dto;

    for (const user of users) {
      await this.inviteMember({
        projectPk,
        inviterUserPk,
        userEmail: user.userEmail,
        projectRole: MemberRole.MEMBER
      });
    }

    return { message: `초대 완료` }
  }

  // 프로젝트에서 멤버 강퇴
  async removeMember(projectPk: number, targetUserEmail: string, userPk: number): Promise<void> {
    const project = await this.projectRepository.findOne({ projectPk, isDeletedProject: false });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');

    const hasPermission = await this._hasProjectManagePermission(projectPk, project.serverPk, userPk);
    if (!hasPermission) throw new ForbiddenException('멤버를 강퇴할 권한이 없습니다.');

    const targetUser = await this.userService.getUserByEmail(targetUserEmail);
    if (!targetUser) throw new NotFoundException(`유저 정보를 찾을 수 없습니다.`);

    const targetUserPk = targetUser.userPk;

    const targetMember = await this.projectMemberRepository.findOne({ projectPk, userPk: targetUserPk, pStatus: MemberStatus.ACTIVE });
    if (!targetMember) throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');

    if (targetMember.projectRole === MemberRole.ADMIN) throw new ForbiddenException('관리자 멤버는 강퇴할 수 없습니다.');

    targetMember.pStatus = MemberStatus.INACTIVE;
    await this.projectMemberRepository.save(targetMember);

    // 프로젝트 밑의 채널에서 멤버 강퇴
    await this._updateChannelMembershipStatus(projectPk, targetUserPk, MemberStatus.INACTIVE);
  }

  // 프로젝트 멤버 역할 변경
  async updateMemberRole(projectPk: number, dto: ManageMemberDto): Promise<void> {
    const user = await this.userService.getUserByEmail(dto.userEmail);
    const member = await this.projectMemberRepository.findOne({ projectPk, userPk: user.userPk, pStatus: MemberStatus.ACTIVE });
    if (!member) throw new NotFoundException('멤버를 찾을 수 없습니다.');

    // 단순 토글 (admin <-> member)
    member.projectRole = member.projectRole === MemberRole.ADMIN ? MemberRole.MEMBER : MemberRole.ADMIN;
    await this.projectMemberRepository.save(member);
  }

  // 유저의 마지막 접속한 채널 업데이트
  async updateLastConnectedChannel(userPk: number, channelPk: number): Promise<void> {
    const channel = await this.channelRepository.findOne({ channelPk });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');
    
    const projectPk = channel.projectPk
    const member = await this.projectMemberRepository.findOne({ projectPk, userPk });
    if (!member) throw new NotFoundException('프로젝트 멤버가 아닙니다.');

    member.lastConnectedChannel = channelPk;
    member.lastConnectedTime = new Date();
    await this.projectMemberRepository.save(member);
  }

  // 프로젝트 내 전체 멤버 조회
  async getProjectMembers(projectPk: number, userPk: number): Promise<ProjectMemberDto[]> {
    const members = await this.projectMemberRepository.findMembersByProject(projectPk);
    
    return members.map(m => ({
      projectPk: m.projectPk,
      pStatus: m.pStatus as MemberStatus,
      projectRole: m.projectRole as MemberRole,
      userInfo: {
        userName: m.user.userName,
        userEmail: m.user.userEmail,
        profileImagePath: m.user.profileImagePath,
      }
    }));
  }

  // 특정 사용자의 상세 정보 및 권한 조회
  async getMemberDetail(projectPk: number, userPk: number): Promise<ProjectMemberDto> {
    const member = await this.projectMemberRepository.findOne({ projectPk, userPk }, ['user']);
    if (!member) throw new NotFoundException('멤버를 찾을 수 없습니다.');

    return {
      projectPk: member.projectPk,
      pStatus: member.pStatus as MemberStatus,
      projectRole: member.projectRole as MemberRole,
      userInfo: {
        userName: member.user.userName,
        userEmail: member.user.userEmail,
        profileImagePath: member.user.profileImagePath,
      }
    };
  }

  // 멤버 차단
  async banMemberFromProject(projectPk: number ,userEmail: string, adminUserPk: number): Promise<{ message: string }> {
    const user = await this.userService.getUserByEmail(userEmail);
    const project = await this.projectRepository.findOne({ projectPk, isDeletedProject: false});

    if (!project) throw new NotFoundException(`프로젝트를 찾을 수 없습니다`);

    // 권한 체크
    const hasPermission = await this._hasProjectManagePermission(projectPk, project.serverPk, adminUserPk);
    if (!hasPermission) throw new ForbiddenException(`차단 권한이 없습니다`);

    const member = await this.projectMemberRepository.findOne({ projectPk, userPk: user.userPk });
    if (!member) throw new NotFoundException(`멤버를 찾을 수 없습니다`);

    member.pStatus = MemberStatus.BANNED;
    await this.projectMemberRepository.save(member);

    return { message: `사용자 차단 성공` };
  }

  // 멤버 차단 해제
  async unbanMemberFromProject(projectPk: number, userEmail: string, ownerUserPk: number): Promise<{ message: string }> {
    const user = await this.userService.getUserByEmail(userEmail);

    const member = await this.projectMemberRepository.findOne({ projectPk, userPk: user.userPk, pStatus: MemberStatus.BANNED });
    if (!member) throw new NotFoundException(`차단 된 프로젝트 멤버가 아닙니다`);

    member.pStatus = MemberStatus.ACTIVE;
    await this.projectMemberRepository.save(member);

    return { message: `차단 해제 성공` }
  }

  // 프로젝트 나가기
  async leaveProject(projectPk: number, userPk: number): Promise<{ message: string }> {
    const member = await this.projectMemberRepository.findOne({ projectPk, userPk, pStatus: MemberStatus.ACTIVE });
    if (!member) throw new NotFoundException(`프로젝트 멤버가 아닙니다`);

    const countManager = await this.projectMemberRepository.countProjectManagers(projectPk);

    if (countManager <= 1) throw new ForbiddenException(`마지막 관리자는 프로젝트를 나갈 수 없습니다. 관리자를 위임하거나 프로젝트를 삭제하세요`);

    member.pStatus = MemberStatus.INACTIVE;
    await this.projectMemberRepository.save(member);

    return { message: `프로젝트 나가기 성공` }
  }

  // 사용자가가 마지막으로 방문한 채널 조회
  async getLastConnectedChannelInfo(userPk: number): Promise<LastChannelDto> {
    const lastConnected = await this.projectMemberRepository.findLastConnectedWithServer(userPk);

    if (!lastConnected || !lastConnected.project?.server) {
      throw new NotFoundException('최근 접속한 채널 정보를 찾을 수 없습니다.');
    }

    return {
      serverUrl: lastConnected.project.server.serverUrl,
      projectPk: lastConnected.projectPk,
      channelPk: lastConnected.lastConnectedChannel,
    };
  };

  // 헬퍼: 공개 채널 자동 추가
  private async _addAllPublicChannels(projectPk: number, userPk: number): Promise<void> {
    // 1. 해당 프로젝트의 모든 공개 채널 조회
    const publicChannels = await this.channelRepository.findPublicChannels(projectPk);
    if (publicChannels.length === 0) return;

    const channelMemberships: Partial<ChannelMember>[] = [];

    for (const channel of publicChannels) {
      const existingCM = await this.channelMemberRepository.findOne({ channelPk: channel.channelPk, userPk });
      if (!existingCM) {
        channelMemberships.push({
          channelPk: channel.channelPk,
          userPk,
          cStatus: MemberStatus.ACTIVE,
          channelRole: MemberRole.MEMBER,
        });
      } else if (existingCM.cStatus !== MemberStatus.ACTIVE) {
        existingCM.cStatus = MemberStatus.ACTIVE;
        await this.channelMemberRepository.save(existingCM);
      }
    }

    if (channelMemberships.length > 0) {
      await this.channelMemberRepository.saveMany(channelMemberships);
    }
  }

  //  헬퍼: 채널 멤버십 상태 업데이트
  private async _updateChannelMembershipStatus(projectPk: number, userPk: number, status: MemberStatus): Promise<void> {
    // 유저가 속한 해당 프로젝트의 채널 멤버십들을 조회하여 상태 변경
    const channelMemberships = await this.channelMemberRepository.findAll({ userPk });
    
    for (const cm of channelMemberships) {
      // 프로젝트에 속한 채널에 멤버 추가 || 강퇴
      const channel = await this.channelRepository.findOne({ channelPk: cm.channelPk });
      if (channel && channel.projectPk === projectPk) {
        cm.cStatus = status;
        await this.channelMemberRepository.save(cm);
      }
    }
  }

    // 헬퍼: 유저의 권한 확인
  private async _hasProjectManagePermission(projectPk: number, serverPk: number, userPk: number): Promise<boolean> {
    const projectMember = await this.projectMemberRepository.findOne({ projectPk, userPk, pStatus: MemberStatus.ACTIVE });
    if (projectMember && MemberRoleUtils.hasAdminPermission(projectMember.projectRole)) return true;

    const serverMember = await this.serverMemberRepository.findOne({ where: { serverPk, userPk, sStatus: MemberStatus.ACTIVE } });
    return serverMember ? ServerRoleUtils.hasProjectCreatePermission(serverMember.serverRole) : false;
  }
}
