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
import {
  CreateChannelDto,
  ChannelResponseDto,
  ChannelListDto,
  ChannelCreateDto,
  ChannelUserListDto,
} from '../dto';

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
    projectPk: number,
    creatorUserPk: number,
  ): Promise<ChannelCreateDto> {
    // 1. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk: creatorUserPk, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(
        `사용자 ID ${creatorUserPk}를 찾을 수 없습니다`,
      );
    }

    // 2. 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { projectPk: projectPk, isDeletedProject: false },
    });

    if (!project) {
      throw new NotFoundException(
        `프로젝트 ID ${projectPk}를 찾을 수 없습니다`,
      );
    }

    // 3. 사용자가 해당 프로젝트의 멤버인지 확인
    const projectMember = await this.projectMemberRepository.findOne({
      where: {
        projectPk: projectPk,
        userPk: creatorUserPk, // creatorUserPk 매개변수 사용
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('사용자가 이 프로젝트의 멤버가 아닙니다');
    }

    // 공지 채널은 프로젝트 관리자만 생성할 수 있습니다.
    if (createChannelDto.channelKind === 'notification' && projectMember.projectRole !== 'admin') {
        throw new ForbiddenException('공지 채널은 프로젝트 관리자만 생성할 수 있습니다.');
    }

    // 4. 채널명 중복 확인 (같은 프로젝트 내에서)
    const existingChannel = await this.channelRepository.findOne({
      where: {
        projectPk: projectPk,
        channelName: createChannelDto.channelName,
        isDeletedChannel: false,
      },
    });

    if (existingChannel) {
      throw new ForbiddenException(
        `채널명 '${createChannelDto.channelName}'이 이 프로젝트에 이미 존재합니다`,
      );
    }

    // 5. 채널 생성
    const channel = this.channelRepository.create({
      projectPk: projectPk,
      channelName: createChannelDto.channelName,
      channelKind: createChannelDto.channelKind.toUpperCase() as 'TEXT' | 'VOICE' | 'NOTIFICATION', // 대문자로 변환
      accessType: createChannelDto.accessType.toUpperCase() as 'PUBLIC' | 'PRIVATE',   // 대문자로 변환
    });
    const savedChannel = await this.channelRepository.save(channel);

    // 6. 채널 생성자 및 프로젝트 관리자/멤버를 채널 멤버로 추가
    let channelRole: 'admin' | 'member'; // DTO에 반환될 채널 역할

    if (savedChannel.accessType === 'PRIVATE') { // isPrivate 대신 accessType 사용
      // Private 채널: 생성자를 채널 admin으로 추가
      const creatorChannelMember = this.channelMemberRepository.create({
        channelPk: savedChannel.channelPk,
        userPk: creatorUserPk, // creatorUserPk 매개변수 사용
        cStatus: 'Active',
        channelRole: 'admin',
      });
      await this.channelMemberRepository.save(creatorChannelMember);
      channelRole = 'admin'; // Private 채널 생성자의 역할은 admin
    } else { // Public 또는 Notification 채널
      // Public 또는 Notification 채널: 프로젝트 관리자를 채널 admin으로, 나머지 프로젝트 멤버를 채널 member로 추가
      const projectMembers = await this.projectMemberRepository.find({
        where: {
          projectPk: projectPk,
          pStatus: 'Active', // 활성 멤버만
        },
      });

      const channelMembersToSave: ChannelMember[] = [];
      const projectAdminUserPks = projectMembers
        .filter((pm) => pm.projectRole === 'admin')
        .map((pm) => pm.userPk);

      // 프로젝트 관리자를 채널 admin으로 추가
      for (const projectAdminPk of projectAdminUserPks) {
        channelMembersToSave.push(
          this.channelMemberRepository.create({
            channelPk: savedChannel.channelPk,
            userPk: projectAdminPk,
            cStatus: 'Active',
            channelRole: 'admin',
          }),
        );
      }

      // 나머지 프로젝트 멤버 (생성자 포함, 단, 이미 admin으로 추가된 경우 제외)를 채널 member로 추가
      for (const projectMember of projectMembers) {
        // 이미 admin으로 추가되었거나, 이미 추가될 예정인 경우 스킵
        if (
          !projectAdminUserPks.includes(projectMember.userPk) &&
          !channelMembersToSave.some((cm) => cm.userPk === projectMember.userPk)
        ) {
          channelMembersToSave.push(
            this.channelMemberRepository.create({
              channelPk: savedChannel.channelPk,
              userPk: projectMember.userPk,
              cStatus: 'Active',
              channelRole: 'member',
            }),
          );
        }
      }

      if (channelMembersToSave.length > 0) {
        await this.channelMemberRepository.save(channelMembersToSave);
      }

      // 생성자의 채널 역할 결정 (Public 또는 Notification 채널의 경우)
      if (projectAdminUserPks.includes(creatorUserPk)) { // creatorUserPk 매개변수 사용
        channelRole = 'admin';
      } else {
        channelRole = 'member';
      }
    }

    return {
      channelPk: savedChannel.channelPk,
      channelName: savedChannel.channelName,
      channelKind: savedChannel.channelKind.toLowerCase() as 'text' | 'voice' | 'notification',
      accessType: savedChannel.accessType.toLowerCase() as 'public' | 'private', // accessType 추가 및 소문자 변환
      channelRole: channelRole, // DTO에 직접 할당
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
      throw new NotFoundException(
        `프로젝트 ID ${projectPk}를 찾을 수 없습니다`,
      );
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
          '(channel.accessType = \'PUBLIC\' OR (channel.accessType = \'PRIVATE\' AND channelMember.userPk = :userPk AND channelMember.cStatus = :activeStatus))',
          { userPk: requestUserPk, activeStatus: 'Active' },
        )
        .getMany();
    } else {
      // 요청 사용자 정보가 없으면 Public 채널만 조회 (활성 멤버 필터링은 필요 없음)
      channels = await this.channelRepository.find({
        where: { projectPk, isDeletedChannel: false, accessType: 'PUBLIC' },
        relations: ['channelMembers'],
      });
    }

    return channels.map((channel) => {
      // 사용자의 채널 역할 찾기
      const userChannelMember = requestUserPk
        ? channel.channelMembers.find(
            (member) => member.userPk === requestUserPk && member.cStatus === 'Active', // Filter for active member
          )
        : null;

      return {
        channelPk: channel.channelPk,
        channelName: channel.channelName,
        channelKind: channel.channelKind.toLowerCase() as 'text' | 'voice' | 'notification', // notification 추가
        accessType: channel.accessType.toLowerCase() as 'public' | 'private', // accessType 추가 및 소문자 변환
        channelRole:
          userChannelMember?.channelRole === 'admin' ? 'admin' : 'member',
      };
    });
  }

  async getChannelById(
    channelPk: number,
    projectPk?: number, // 추가: 프로젝트 컴텍스트 정보
    serverUrl?: string, // 추가: 서버 컴텍스트 정보
  ): Promise<ChannelResponseDto> {
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false },
      relations: ['channelMembers', 'channelMembers.user', 'project'],
    });

    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다`);
    }

    const admin = channel.channelMembers.find(
      (member) => member.channelRole === 'admin',
    );

    return {
      channelPk: channel.channelPk,
      projectPk: channel.projectPk,
      channelName: channel.channelName,
      channelKind: channel.channelKind.toLowerCase() as 'text' | 'voice' | 'notification', // 소문자로 변환
      isDeletedChannel: channel.isDeletedChannel,
      accessType: channel.accessType.toLowerCase() as 'public' | 'private', // 소문자로 변환
      projectInfo: {
        projectPk: channel.project.projectPk,
        projectName: channel.project.projectName,
      },
      adminInfo: admin
        ? {
            userName: admin.user.userName,
          }
        : undefined,
    };
  }  
  
  async getAllChannelsForUser(userPk: number): Promise<ChannelUserListDto[]> {
    const channels = await this.channelMemberRepository
      .createQueryBuilder('channelMember')
      .leftJoinAndSelect('channelMember.channel', 'channel')
      .where('channelMember.userPk = :userPk', { userPk })
      .andWhere('channelMember.cStatus = :status', { status: 'Active' }) // Added filter for active members
      .andWhere('channel.isDeletedChannel = false')
      .getMany();

    console.log(`[DEBUG] Raw channels from getAllChannelsForUser for userPk ${userPk}:`, channels);

    return channels.map(channelMember => ({
      channelPk: channelMember.channel.channelPk,
      channelName: channelMember.channel.channelName,
    }));
  }
}
