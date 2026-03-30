import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Server } from '../entities/server.entity';
import { ServerMember } from '../entities/server-member.entity';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { Channel } from '../../channel/entities/channel.entity';
import { ChannelMember } from '../../channel/entities/channel-member.entity';
import { findActiveEntityById } from '../../../common/utils/entity-status.util';

@Injectable()
export class ServerDeletionService {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async deleteServer(serverPk: number, deleterUserPk: number): Promise<void> {
    // 1. 서버 존재 및 삭제 여부 확인
    await findActiveEntityById(
      this.serverRepository,
      serverPk,
      '서버',
      'serverPk',
      'isDeletedServer',
    );

    // 2. 권한 확인 (삭제하려는 사용자가 서버의 owner인지 확인)
    const deleterMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: deleterUserPk, serverRole: 'owner' },
    });

    if (!deleterMember) {
      throw new UnauthorizedException(
        '서버를 삭제할 권한이 없습니다. 서버 owner만 삭제할 수 있습니다.',
      );
    }

    // 3. 활성 멤버가 있으면 비활성으로 변경
    await this.serverMemberRepository.update(
      { serverPk, sStatus: 'Active' },
      { sStatus: 'Inactive' },
    );

    // 4. 서버 소프트 삭제
    await this.serverRepository.update(serverPk, { isDeletedServer: true });

    // 5. 서버에 속한 모든 프로젝트 소프트 삭제
    const projectsToDelete = await this.projectRepository.find({
      where: { serverPk, isDeletedProject: false },
      select: ['projectPk'],
    });

    if (projectsToDelete.length > 0) {
      const projectPks = projectsToDelete.map((p) => p.projectPk);
      await this.projectRepository.update(
        { projectPk: In(projectPks) },
        { isDeletedProject: true },
      );
      // 프로젝트 멤버들도 모두 삭제
      await this.projectMemberRepository.update(
        { projectPk: In(projectPks), pStatus: 'Active' },
        { pStatus: 'Inactive' },
      );

      // 6. 삭제된 프로젝트에 속한 모든 채널 소프트 삭제
      const channelsToDelete = await this.channelRepository.find({
        where: { projectPk: In(projectPks), isDeletedChannel: false },
        select: ['channelPk'],
      });

      if (channelsToDelete.length > 0) {
        const channelPks = channelsToDelete.map((c) => c.channelPk);
        await this.channelRepository.update(
          { channelPk: In(channelPks) },
          { isDeletedChannel: true },
        );
        // 채널 멤버들도 모두 삭제
        await this.channelMemberRepository.update(
          { channelPk: In(channelPks), cStatus: 'Active' },
          { cStatus: 'Inactive' },
        );
      }
    }
  }
}
