import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { Channel } from '../../text-channel/entities/channel.entity';
import { ChannelMember } from '../../text-channel/entities/channel-member.entity';
import { ProjectNotificationService } from './project-notification.service';
import { Server }from '../../server/entities/server.entity'

@Injectable()
export class ProjectDeletionService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    private readonly projectNotificationService: ProjectNotificationService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async deleteProject(projectPk: number, deleterUserPk: number): Promise<void> {
    // 1. 프로젝트 존재 및 삭제 여부 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false },
    });
    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없거나 이미 삭제되었습니다.`);
    }

    // 프로젝트가 속한 서버 찾기
    const server = await this.serverRepository.findOne({
      where: { serverPk: project.serverPk}
    });
    if (!server) {
      throw new NotFoundException(`프로젝트가 속한 서버를 찾을 수 없습니다.`);
    }

    // 2. 권한 확인 (삭제하려는 사용자가 프로젝트의 admin인지 확인)
    const deleterMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: deleterUserPk, projectRole: 'admin' },
    });

    if (!deleterMember) {
      throw new UnauthorizedException('프로젝트를 삭제할 권한이 없습니다. 프로젝트 admin만 삭제할 수 있습니다.');
    }

    // 3. 활성 멤버 있으면 비활성으로 변경
    await this.projectMemberRepository.update(
      { projectPk, pStatus: 'Active' },
      { pStatus: 'Inactive' },
    )

    // 4. 프로젝트 소프트 삭제
    await this.projectRepository.update(projectPk, { isDeletedProject: true });

    // 5. 프로젝트에 속한 모든 채널 소프트 삭제
    const channelsToDelete = await this.channelRepository.find({
      where: { projectPk, isDeletedChannel: false },
      select: ['channelPk'],
    });

    if (channelsToDelete.length > 0) {
      const channelPks = channelsToDelete.map(c => c.channelPk);
      await this.channelRepository.update(
        { channelPk: In(channelPks) },
        { isDeletedChannel: true },
      );
      // 삭제된 채널의 모든 채널 멤버 비활성화
      await this.channelMemberRepository.update(
        { channelPk: In(channelPks), cStatus: 'Active' },
        { cStatus: 'Inactive' },
      )
    }

    // 알림 전송 (비동기)
    this.projectNotificationService.notifyProjectRemoved(project.projectPk, project.projectName, server.serverUrl);
  }
}
