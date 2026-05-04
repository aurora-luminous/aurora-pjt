import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ProjectService } from '../project.service';
import { ProjectRepository } from '../../repositories/project.repository';
import { ProjectMemberRepository } from '../../repositories/project-member.repository';
import { ChannelRepository } from 'src/domain/channel/repositories/channel.repository';
import { ChannelMemberRepository } from 'src/domain/channel/repositories/channel-member.repository';
import { ProjectNotificationService } from '../project-notification.service';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto, ProjectListDto } from '../../dto';
import { MemberStatus, MemberRole, ServerRoleUtils, MemberRoleUtils, ChannelKind } from 'src/common/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Server } from '../../../server/entities/server.entity';
import { ServerMember } from '../../../server/entities/server-member.entity';
import { Project } from '../../entities/project.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { Channel } from '../../../channel/entities/channel.entity';
import { ChannelMember } from '../../../channel/entities/channel-member.entity';

@Injectable()
export class ProjectServiceImpl extends ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly projectNotificationService: ProjectNotificationService,
    private readonly channelRepository: ChannelRepository,
    private readonly channelMemberRepository: ChannelMemberRepository,
    private readonly dataSource: DataSource,

    // 서버 리팩토링 후 수정 필요
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,

  ) {
    super();
  }

  // 공통 권한 체크 헬퍼
  private async _hasProjectManagePermission(projectPk: number, serverPk: number, userPk: number): Promise<boolean> {
    const projectMember = await this.projectMemberRepository.findOne({ projectPk, userPk, pStatus: MemberStatus.ACTIVE });
    if (projectMember && MemberRoleUtils.hasAdminPermission(projectMember.projectRole)) return true;

    const serverMember = await this.serverMemberRepository.findOne({ where: { serverPk, userPk, sStatus: MemberStatus.ACTIVE } });
    return serverMember ? ServerRoleUtils.hasProjectCreatePermission(serverMember.serverRole) : false;
  }

  // 새 프로젝트 생성
  async createProject(dto: CreateProjectDto): Promise<ProjectResponseDto> {
    // 1. 서버 존재 확인
    let server;
    if (dto.serverUrl) {
      server = await this.serverRepository.findOne({
        where: { serverUrl: dto.serverUrl, isDeletedServer: false },
      });
    } else if (dto.serverPk) {
      server = await this.serverRepository.findOne({
        where: { serverPk: dto.serverPk, isDeletedServer: false },
      });
    }
  
    if (!server) {
      throw new NotFoundException('서버를 찾을 수 없습니다');
    }
  
    // 2. 사용자가 해당 서버의 멤버인지 확인 및 정보 가져오기
    const serverMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: server.serverPk,
        userPk: dto.creatorUserPk,
        sStatus: MemberStatus.ACTIVE,
      },
      relations: ['user'],
    });
  
    if (!serverMember) {
      throw new ForbiddenException('사용자가 이 서버의 멤버가 아닙니다');
    }
  
    // 3. 프로젝트 생성 권한 확인 (admin, owner, projectManager 가능)
    if (!ServerRoleUtils.hasProjectCreatePermission(serverMember.serverRole)) {
      throw new ForbiddenException(
        '관리자, 소유자 또는 프로젝트 매니저만 프로젝트를 생성할 수 있습니다',
      );
    }
    
    // channelKind와 accessType을 엔티티 타입에 맞게 고정 (대문자)
    const defaultKind = 'TEXT' as Channel['channelKind'];
    const defaultAccess = 'PUBLIC' as Channel['accessType'];
  
    // --- 트랜잭션 시작 ---
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      // 4. 프로젝트 생성
      const savedProject = await queryRunner.manager.save(Project, {
        serverPk: server.serverPk,
        projectName: dto.projectName,
        isDefault: dto.isDefault ?? false,
      });
    
      // 5. 생성자를 프로젝트 admin으로 추가
      await queryRunner.manager.save(ProjectMember, {
        projectPk: savedProject.projectPk,
        userPk: dto.creatorUserPk,
        pStatus: 'Active' as ProjectMember['pStatus'],
        projectRole: 'admin' as ProjectMember['projectRole'],
      });
    
      // 6. 기본 "일반" 채널 생성
      const savedChannel = await queryRunner.manager.save(Channel, {
        projectPk: savedProject.projectPk,
        channelName: '일반',
        channelKind: defaultKind,
        accessType: defaultAccess,
        isDefault: true,
      });
    
      // 7. 생성자를 채널 멤버로 추가
      await queryRunner.manager.save(ChannelMember, {
        channelPk: savedChannel.channelPk,
        userPk: dto.creatorUserPk,
        cStatus: 'Active' as ChannelMember['cStatus'],
        channelRole: 'admin' as ChannelMember['channelRole'],
      });
    
      await queryRunner.commitTransaction();
    
      // 프로젝트 변경 알림 전송
      this.projectNotificationService.notifyProjectAdded(
        savedProject.projectPk,
        savedProject.projectName,
        server.serverUrl,
      );
    
      // 8. DTO 직접 구성하여 반환
      return {
        projectPk: savedProject.projectPk,
        serverPk: savedProject.serverPk,
        projectName: savedProject.projectName,
        isDeletedProject: savedProject.isDeletedProject,
        serverInfo: {
          serverPk: server.serverPk,
          serverName: server.serverName,
        },
        adminInfo: {
          userName: serverMember.user.userName,
        },
      };
    
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    };
  }

  // 프로젝트 정보 수정(이름)
  async updateProject(
    projectPk: number,
    projectName: string,
    userPk: number
  ): Promise<{ message: string }> {
    const project = await this.projectRepository.findOne({
      projectPk,
      isDeletedProject: false,
    }, ['server']);

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다.`);
    }

    const hasPermission = await this._hasProjectManagePermission(projectPk, project.serverPk, userPk);
    if (!hasPermission) {
      throw new ForbiddenException('프로젝트 이름을 변경할 권한이 없습니다.');
    }

    project.projectName = projectName;
    const updatedProject = await this.projectRepository.save(project);

    // 알림 전송 (비동기)
    this.projectNotificationService.notifyProjectUpdated(
      updatedProject.projectPk,
      updatedProject.projectName,
      project.server.serverUrl,
    );

    return { message: `프로젝트 업데이트 성공`};
  }

  // 프로젝트 삭제
  async deleteProject(projectPk: number, deleteUserPk: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      projectPk,
      isDeletedProject: false,
    }, ['server']);

    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없거나 이미 삭제되었습니다.`);
    }

    if (project.isDefault) throw new ForbiddenException(`서버의 기본 프로젝트는 삭제할 수 없습니다.`);

    const projectMember = await this.projectMemberRepository.findOne({
      projectPk,
      userPk: deleteUserPk,
      pStatus: MemberStatus.ACTIVE,
    });

    if (!projectMember || projectMember.projectRole !== MemberRole.ADMIN) {
      throw new ForbiddenException('프로젝트 admin만 삭제할 수 있습니다.');
    }

    // --- 트랜잭션 시작 (채널, 멤버 계층적 소프트 삭제) ---
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 프로젝트 소프트 삭제
      await queryRunner.manager.update(Project, { projectPk }, { isDeletedProject: true });

      // 2. 프로젝트 멤버들 비활성화
      await queryRunner.manager.update(ProjectMember, { projectPk, pStatus: MemberStatus.ACTIVE }, { pStatus: MemberStatus.INACTIVE });

      // 3. 프로젝트에 속한 모든 채널 소프트 삭제 및 채널 멤버 비활성화
      const channels = await this.channelRepository.findPublicChannels( projectPk );
      if (channels.length > 0) {
        const channelPks = channels.map(c => c.channelPk);
        await queryRunner.manager.update(Channel, { channelPk: In(channelPks) }, { isDeletedChannel: true });
        await queryRunner.manager.update(ChannelMember, { channelPk: In(channelPks), cStatus: MemberStatus.ACTIVE }, { cStatus: MemberStatus.INACTIVE });
      }

      await queryRunner.commitTransaction();

      // 알림 전송 (비동기)
      this.projectNotificationService.notifyProjectRemoved(
        project.projectPk,
        project.projectName,
        project.server.serverUrl,
      );

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('프로젝트 삭제 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 한 서버의 모든 프로젝트 목록 조회
  async getProjectsByServer(serverUrl: string): Promise<ProjectListDto[]> {
    const server = await this.serverRepository.findOne({ where: { serverUrl, isDeletedServer: false } });
    if (!server) {
      throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다.`);
    }

    const projects = await this.projectRepository.findProjectsByServer(server.serverPk); 
    // 각 프로젝트별로 admin 정보를 포함하여 DTO 변환
    const result: ProjectListDto[] = [];
    for (const project of projects) {
      if (project.isDeletedProject) continue;

      result.push({
        projectPk: project.projectPk,
        projectName: project.projectName,
        
      });
    }

    return result;
  }

  // 한 서버에서 특정 유저가 속한 프로젝트 목록 조회
  async getProjectByServerForUser(serverUrl: string, userPk: number): Promise<ProjectListDto[]> {
    const server = await this.serverRepository.findOne({ where: { serverUrl, isDeletedServer: false } });
    if (!server) {
      throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다.`);
    }

    const activeMemberships = await this.projectMemberRepository.findActiveMemberByUser(userPk);
    
    return activeMemberships
      .filter(m => m.project.serverPk === server.serverPk && !m.project.isDeletedProject)
      .map(m => ({
        projectPk: m.project.projectPk,
        projectName: m.project.projectName,
      }));
  }
}
