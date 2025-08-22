import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { Project } from '../../project/entities/project.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { User } from '../../user/entities/user.entity';
import { CreateChannelDto, ChannelResponseDto, ChannelListDto, ChannelCreateDto } from '../dto';

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
  ): Promise<ChannelCreateDto> {
    // 1. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk: createChannelDto.creatorUserPk, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createChannelDto.creatorUserPk} not found`,
      );
    }

    // 2. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk: createChannelDto.projectPk, isDeletedProject: false },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${createChannelDto.projectPk} not found`,
      );
    }

    // 3. 사용자가 해당 프로젝트의 멤버인지 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: {
        projectPk: createChannelDto.projectPk,
        userPk: createChannelDto.creatorUserPk,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('User is not a member of this project');
    }

    // 4. 채널명 중복 확인 (같은 프로젝트 내에서)
    const existingChannel = await this.channelRepository.findOne({
      where: {
        projectPk: createChannelDto.projectPk,
        channelName: createChannelDto.channelName,
        isDeletedChannel: false,
      },
    });

    if (existingChannel) {
      throw new ForbiddenException(
        `Channel with name '${createChannelDto.channelName}' already exists in this project`,
      );
    }

    // 5. 채널 생성
    const channel = this.channelRepository.create({
      projectPk: createChannelDto.projectPk,
      channelName: createChannelDto.channelName,
      channelKind: createChannelDto.channelKind,
      isPrivate: createChannelDto.isPrivate || false,
    });
    const savedChannel = await this.channelRepository.save(channel);

    // 6. 생성자를 채널 owner로 추가
    const channelMember = this.channelMemberRepository.create({
      channelPk: savedChannel.channelPk,
      userPk: createChannelDto.creatorUserPk,
      cStatus: 'Active', // 기본 상태
      channelRole: 'owner',
    });
    await this.channelMemberRepository.save(channelMember);

    // 7. Public 채널인 경우 프로젝트의 모든 멤버를 자동으로 추가
    if (!savedChannel.isPrivate) {
      const projectMembers = await this.projectMemberRepository.find({
        where: { 
          projectPk: createChannelDto.projectPk,
          pStatus: 'Active' // 활성 멤버만
        }
      });

      const channelMembersToAdd = projectMembers
        .filter(member => member.userPk !== createChannelDto.creatorUserPk) // 생성자는 이미 추가됨
        .map(member => this.channelMemberRepository.create({
          channelPk: savedChannel.channelPk,
          userPk: member.userPk,
          cStatus: 'Active',
          channelRole: 'member',
        }));

      if (channelMembersToAdd.length > 0) {
        await this.channelMemberRepository.save(channelMembersToAdd);
      }
    }

    return {
      channelName: savedChannel.channelName,
      channelKind: savedChannel.channelKind.toLowerCase() as 'text' | 'voice',
      isPrivate: savedChannel.isPrivate,
    };
  }

  async getChannelsByProject(
    projectPk: number,
    requestUserPk?: number,
    serverUrl?: string, // 추가: 서버 컴텍스트 정보
  ): Promise<ChannelListDto[]> {
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
        relations: ['channelMembers'],
      });
    }

    return channels.map((channel) => {
      // 사용자의 채널 역할 찾기
      const userChannelMember = requestUserPk 
        ? channel.channelMembers.find(member => member.userPk === requestUserPk)
        : null;
      
      return {
        channelPk: channel.channelPk,
        channelName: channel.channelName,
        channelKind: channel.channelKind.toLowerCase() as 'text' | 'voice',
        isPrivate: channel.isPrivate,
        channelRole: userChannelMember?.channelRole === 'owner' ? 'admin' : 'member',
      };
    });
  }

  async getChannelById(
    channelPk: number,
    projectPk?: number, // 추가: 프로젝트 컴텍스트 정보
    serverUrl?: string,  // 추가: 서버 컴텍스트 정보
  ): Promise<ChannelResponseDto> {
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
            
            userName: owner.user.userName,
          }
        : undefined,
    };
  }
}