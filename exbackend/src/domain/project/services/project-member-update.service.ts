import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { Channel } from '../../text-channel/entities/channel.entity';

@Injectable()
export class ProjectMemberUpdateService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

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
