import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { Channel } from '../../text-channel/entities/channel.entity';
import { Project } from '../entities/project.entity';
import { Server } from '../../server/entities/server.entity';
import { LastChannelInfoDto } from '../../../member-status/dto/last-channel-info.dto';

@Injectable()
export class ProjectMemberUpdateService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async getLastConnectedChannelInfo(userPk: number): Promise<LastChannelInfoDto | null> {
    const lastConnected = await this.projectMemberRepository
      .createQueryBuilder('pm')
      .leftJoinAndSelect('pm.project', 'project')
      .leftJoinAndSelect('project.server', 'server')
      .where('pm.userPk = :userPk', { userPk })
      .andWhere('pm.lastConnectedChannel IS NOT NULL')
      .orderBy('pm.lastConnectedTime', 'DESC')
      .take(1)
      .getOne();

    if (!lastConnected || !lastConnected.project || !lastConnected.project.server) {
      return null;
    }

    return {
      serverUrl: lastConnected.project.server.serverUrl,
      projectPk: lastConnected.project.projectPk,
      channelPk: lastConnected.lastConnectedChannel,
    };
  }

  async updateLastConnectedChannel(
    userPk: number,
    channelPk: number,
  ): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { channelPk },
    });

    if (!channel) {
      throw new NotFoundException(`채널 ${channelPk} 을 찾을 수 없습니다.`);
    }

    const projectPk = channel.projectPk;

    const projectMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk },
    });

    if (!projectMember) {
      throw new NotFoundException(
        `프로젝트 ${projectPk} 에 유저 ${userPk} 를 찾을 수 없습니다.`,
      );
    }

    try {
      projectMember.lastConnectedChannel = channelPk;
      projectMember.lastConnectedTime = new Date();
      await this.projectMemberRepository.save(projectMember);
    } catch (error) {
      throw new InternalServerErrorException('마지막 채널 갱신에 실패했습니다.');
    }
  }
}
