import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { User } from '../../user/entities/user.entity';
import { Server } from '../../server/entities/server.entity';
import { ServerMember } from '../../server/entities/server-member.entity';

export interface InviteToProjectDto {
  projectPk: number;
  userEmail: string;
  inviterUserPk: number;
  projectRole?: 'member' | 'admin';
}

export interface ProjectMemberDto {
  projectMemberPk: number;
  projectPk: number;
  userPk: number;
  pStatus: 'Active' | 'Inactive' | 'Banned';
  projectRole: 'member' | 'admin' | 'owner';
  userInfo: {
    userPk: number;
    userName: string;
    userEmail: string;
    profileImagePath: string;
  };
}

export interface RemoveFromProjectDto {
  projectPk: number;
  targetUserPk: number;
  adminUserPk: number;
}

@Injectable()
export class ProjectInvitationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
  ) {}

  // 이메일로 프로젝트에 사용자 초대 (직접 추가)
  async inviteUserToProject(inviteDto: InviteToProjectDto): Promise<ProjectMemberDto> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk: inviteDto.projectPk, isDeletedProject: false },
      relations: ['server']
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${inviteDto.projectPk} not found`);
    }

    // 2. 초대하려는 사용자 존재 확인 (이메일로)
    const targetUser = await this.userRepository.findOne({
      where: { userEmail: inviteDto.userEmail, isDeleted: false }
    });

    if (!targetUser) {
      throw new NotFoundException(`User with email ${inviteDto.userEmail} not found`);
    }

    // 3. 초대자가 해당 프로젝트의 관리자인지 확인
    const inviterMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk: inviteDto.projectPk, 
        userPk: inviteDto.inviterUserPk,
        pStatus: 'Active'
      }
    });

    if (!inviterMember || !['admin', 'owner'].includes(inviterMember.projectRole)) {
      throw new ForbiddenException('Only project admin or owner can invite users');
    }

    // 4. 초대할 사용자가 해당 서버의 멤버인지 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk: project.serverPk, 
        userPk: targetUser.userPk,
        status: 'Approved'
      }
    });

    if (!serverMember) {
      throw new ForbiddenException('User must be a server member to join projects');
    }

    // 5. 이미 프로젝트 멤버인지 확인
    const existingMember = await this.projectMemberRepository.findOne({
      where: { projectPk: inviteDto.projectPk, userPk: targetUser.userPk }
    });

    if (existingMember) {
      if (existingMember.pStatus === 'Active') {
        throw new ConflictException('User is already an active member of this project');
      } else if (existingMember.pStatus === 'Banned') {
        throw new ConflictException('User is banned from this project');
      } else if (existingMember.pStatus === 'Inactive') {
        // 비활성 사용자를 다시 활성화
        existingMember.pStatus = 'Active';
        existingMember.projectRole = inviteDto.projectRole || 'member';
        const reactivatedMember = await this.projectMemberRepository.save(existingMember);
        
        return {
          projectMemberPk: reactivatedMember.projectMemberPk,
          projectPk: reactivatedMember.projectPk,
          userPk: reactivatedMember.userPk,
          pStatus: reactivatedMember.pStatus,
          projectRole: reactivatedMember.projectRole,
          userInfo: {
            userPk: targetUser.userPk,
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

    return {
      projectMemberPk: savedMember.projectMemberPk,
      projectPk: savedMember.projectPk,
      userPk: savedMember.userPk,
      pStatus: savedMember.pStatus,
      projectRole: savedMember.projectRole,
      userInfo: {
        userPk: targetUser.userPk,
        userName: targetUser.userName,
        userEmail: targetUser.userEmail,
        profileImagePath: targetUser.profileImagePath,
      },
    };
  }

  // 프로젝트 멤버 목록 조회
  async getProjectMembers(projectPk: number, requestUserPk: number): Promise<ProjectMemberDto[]> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectPk} not found`);
    }

    // 2. 요청자가 프로젝트 멤버인지 확인
    const requestMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk, 
        userPk: requestUserPk, 
        pStatus: 'Active'
      }
    });

    if (!requestMember) {
      throw new ForbiddenException('Only project members can view member list');
    }

    // 3. 활성 멤버 목록 조회
    const projectMembers = await this.projectMemberRepository.find({
      where: { projectPk, pStatus: 'Active' },
      relations: ['user'],
      order: { projectMemberPk: 'ASC' },
    });

    return projectMembers.map(member => ({
      projectMemberPk: member.projectMemberPk,
      projectPk: member.projectPk,
      userPk: member.userPk,
      pStatus: member.pStatus,
      projectRole: member.projectRole,
      userInfo: {
        userPk: member.user.userPk,
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
      throw new NotFoundException(`Project with ID ${removeDto.projectPk} not found`);
    }

    // 2. 제거할 멤버 확인
    const targetMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk: removeDto.projectPk, 
        userPk: removeDto.targetUserPk,
        pStatus: 'Active'
      }
    });

    if (!targetMember) {
      throw new NotFoundException('Target user is not an active member of this project');
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk: removeDto.projectPk, 
        userPk: removeDto.adminUserPk,
        pStatus: 'Active'
      }
    });

    if (!adminMember || !['admin', 'owner'].includes(adminMember.projectRole)) {
      throw new ForbiddenException('Only project admin or owner can remove members');
    }

    // 4. Owner는 제거할 수 없음
    if (targetMember.projectRole === 'owner') {
      throw new ForbiddenException('Cannot remove project owner');
    }

    // 5. Admin끼리는 제거 불가 (Owner만 Admin 제거 가능)
    if (targetMember.projectRole === 'admin' && adminMember.projectRole !== 'owner') {
      throw new ForbiddenException('Only project owner can remove admin members');
    }

    // 6. 상태를 Inactive로 변경 (soft delete)
    targetMember.pStatus = 'Inactive';
    await this.projectMemberRepository.save(targetMember);
  }

  // 프로젝트에서 사용자 차단
  async banUserFromProject(projectPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectPk} not found`);
    }

    // 2. 차단할 멤버 확인
    const targetMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: targetUserPk }
    });

    if (!targetMember || targetMember.pStatus === 'Banned') {
      throw new NotFoundException('Target user is not found or already banned');
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk, 
        userPk: adminUserPk,
        pStatus: 'Active'
      }
    });

    if (!adminMember || !['admin', 'owner'].includes(adminMember.projectRole)) {
      throw new ForbiddenException('Only project admin or owner can ban members');
    }

    // 4. Owner는 차단할 수 없음
    if (targetMember.projectRole === 'owner') {
      throw new ForbiddenException('Cannot ban project owner');
    }

    // 5. Admin끼리는 차단 불가 (Owner만 Admin 차단 가능)
    if (targetMember.projectRole === 'admin' && adminMember.projectRole !== 'owner') {
      throw new ForbiddenException('Only project owner can ban admin members');
    }

    // 6. 상태를 Banned로 변경
    targetMember.pStatus = 'Banned';
    await this.projectMemberRepository.save(targetMember);
  }

  // 프로젝트에서 차단 해제 (Owner만 가능)
  async unbanUserFromProject(projectPk: number, targetUserPk: number, ownerUserPk: number): Promise<ProjectMemberDto> {
    // 1. 차단된 멤버 확인
    const bannedMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: targetUserPk, pStatus: 'Banned' },
      relations: ['user']
    });

    if (!bannedMember) {
      throw new NotFoundException('Banned member not found');
    }

    // 2. Owner 권한 확인
    const ownerMember = await this.projectMemberRepository.findOne({
      where: { 
        projectPk, 
        userPk: ownerUserPk,
        pStatus: 'Active',
        projectRole: 'owner'
      }
    });

    if (!ownerMember) {
      throw new ForbiddenException('Only project owner can unban members');
    }

    // 3. 상태를 Active로 복구
    bannedMember.pStatus = 'Active';
    const unbannedMember = await this.projectMemberRepository.save(bannedMember);

    return {
      projectMemberPk: unbannedMember.projectMemberPk,
      projectPk: unbannedMember.projectPk,
      userPk: unbannedMember.userPk,
      pStatus: unbannedMember.pStatus,
      projectRole: unbannedMember.projectRole,
      userInfo: {
        userPk: bannedMember.user.userPk,
        userName: bannedMember.user.userName,
        userEmail: bannedMember.user.userEmail,
        profileImagePath: bannedMember.user.profileImagePath,
      },
    };
  }
}