import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { Channel } from '../../text-channel/entities/channel.entity';
import { ChannelMember } from '../../text-channel/entities/channel-member.entity';

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
  ) {}

  async deleteProject(projectPk: number, deleterUserPk: number): Promise<void> {
    // 1. 프로젝트 존재 및 삭제 여부 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false },
    });
    if (!project) {
      throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없거나 이미 삭제되었습니다.`);
    }

    // 2. 권한 확인 (삭제하려는 사용자가 프로젝트의 admin인지 확인)
    const deleterMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: deleterUserPk, projectRole: 'admin' },
    });

    if (!deleterMember) {
      throw new UnauthorizedException('프로젝트를 삭제할 권한이 없습니다. 프로젝트 admin만 삭제할 수 있습니다.');
    }

    // 3. 활성 멤버 존재 여부 확인
    const activeProjectMembersCount = await this.projectMemberRepository.count({
      where: { projectPk, pStatus: 'Active' },
    });

    if (activeProjectMembersCount > 0) {
      throw new BadRequestException('사용자가 존재하므로 프로젝트를 삭제할 수 없습니다.');
    }

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
    }
  }
}
