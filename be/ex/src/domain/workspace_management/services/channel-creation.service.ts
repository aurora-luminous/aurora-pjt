import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../../../entities/channel.entity';
import { ChannelMember } from '../../../entities/channel-member.entity';
import { Project } from '../../../entities/project.entity';
import { ProjectMember } from '../../../entities/project-member.entity';
import { User } from '../../../entities/user.entity';

export interface CreateChannelDto {
  projectPk: number;
  channelName: string;
  channelKind: 'TEXT' | 'VOICE' | 'VIDEO';
  isPrivate: boolean;
  creatorUserPk: number;
}

export interface ChannelResponseDto {
  channelPk: number;
  projectPk: number;
  channelName: string;
  channelKind: 'TEXT' | 'VOICE' | 'VIDEO';
  isDeletedChannel: boolean;
  isPrivate: boolean;
  projectInfo?: {
    projectPk: number;
    projectName: string;
  };
  ownerInfo?: {
    user_pk: number;
    user_name: string;
  };
}

@Injectable()
export class ChannelCreationService {
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

  async createChannel(
    createChannelDto: CreateChannelDto,
  ): Promise<ChannelResponseDto> {
    // 1. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk: createChannelDto.projectPk, isDeletedProject: false },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${createChannelDto.projectPk} not found`,
      );
    }

    // 2. 사용자가 해당 프로젝트의 멤버인지 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: {
        projectPk: createChannelDto.projectPk,
        userPk: createChannelDto.creatorUserPk,
      },
      relations: ['user'],
    });

    if (!projectMember) {
      throw new ForbiddenException('User is not a member of this project');
    }

    // 3. 프로젝트 멤버면 누구나 채널 생성 가능 (권한 제한 없음)

    // 4. 채널 생성 (단순히 DB에 정보만 저장)
    const channel = this.channelRepository.create({
      projectPk: createChannelDto.projectPk,
      channelName: createChannelDto.channelName,
      channelKind: createChannelDto.channelKind,
      isPrivate: createChannelDto.isPrivate,
    });
    const savedChannel = await this.channelRepository.save(channel);

    // 5. 생성자를 채널 owner로 추가
    const channelMember = this.channelMemberRepository.create({
      channelPk: savedChannel.channelPk,
      userPk: createChannelDto.creatorUserPk,
      channelRole: 'owner',
    });
    await this.channelMemberRepository.save(channelMember);

    return {
      channelPk: savedChannel.channelPk,
      projectPk: savedChannel.projectPk,
      channelName: savedChannel.channelName,
      channelKind: savedChannel.channelKind,
      isDeletedChannel: savedChannel.isDeletedChannel,
      isPrivate: savedChannel.isPrivate,
      projectInfo: {
        projectPk: project.projectPk,
        projectName: project.projectName,
      },
      ownerInfo: {
        user_pk: projectMember.user.userPk,
        user_name: projectMember.user.userName,
      },
    };
  }

  async getChannelsByProject(
    projectPk: number,
    requestUserPk?: number,
  ): Promise<ChannelResponseDto[]> {
    // 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectPk} not found`);
    }

    let channels: Channel[];

    if (requestUserPk) {
      // 사용자별 접근 가능한 채널만 조회
      // 1. Public 채널 (모든 프로젝트 멤버 접근 가능)
      // 2. Private 채널 중 사용자가 멤버인 채널만
      channels = await this.channelRepository
        .createQueryBuilder('channel')
        .leftJoinAndSelect('channel.channelMembers', 'channelMember')
        .leftJoinAndSelect('channelMember.user', 'user')
        .leftJoinAndSelect('channel.project', 'project')
        .where('channel.projectPk = :projectPk', { projectPk })
        .andWhere('channel.isDeletedChannel = false')
        .andWhere(
          // Public 채널이거나 Private 채널 중 사용자가 멤버인 경우
          '(channel.isPrivate = false OR (channel.isPrivate = true AND channelMember.userPk = :userPk))',
          { userPk: requestUserPk },
        )
        .getMany();
    } else {
      // 요청 사용자 정보가 없으면 Public 채널만 조회
      channels = await this.channelRepository.find({
        where: { projectPk, isDeletedChannel: false, isPrivate: false },
        relations: ['channelMembers', 'channelMembers.user', 'project'],
      });
    }

    return channels.map((channel) => {
      const owner = channel.channelMembers.find(
        (member) => member.channelRole === 'owner',
      );

      return {
        channelPk: channel.channelPk,
        projectPk: channel.projectPk,
        channelName: channel.channelName,
        channelKind: channel.channelKind,
        isDeletedChannel: channel.isDeletedChannel,
        isPrivate: channel.isPrivate,
        projectInfo: {
          projectPk: channel.project.projectPk,
          projectName: channel.project.projectName,
        },
        ownerInfo: owner
          ? {
              user_pk: owner.user.userPk,
              user_name: owner.user.userName,
            }
          : undefined,
      };
    });
  }

  async getChannelById(channelPk: number): Promise<ChannelResponseDto> {
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false },
      relations: ['channelMembers', 'channelMembers.user', 'project'],
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${channelPk} not found`);
    }

    const owner = channel.channelMembers.find(
      (member) => member.channelRole === 'owner',
    );

    return {
      channelPk: channel.channelPk,
      projectPk: channel.projectPk,
      channelName: channel.channelName,
      channelKind: channel.channelKind,
      isDeletedChannel: channel.isDeletedChannel,
      isPrivate: channel.isPrivate,
      projectInfo: {
        projectPk: channel.project.projectPk,
        projectName: channel.project.projectName,
      },
      ownerInfo: owner
        ? {
            user_pk: owner.user.userPk,
            user_name: owner.user.userName,
          }
        : undefined,
    };
  }
}
