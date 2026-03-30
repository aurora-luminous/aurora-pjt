import {
  Injectable, 
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { ChannelService } from '../channel.service';
import { ChannelRepository } from '../../repositories/channel.repository';
import { ChannelMemberRepository } from '../../repositories/channel-member.repository';
import { ChannelNotificationService } from '../channel-notofication.service';
import { Channel } from '../../entities/channel.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { Project } from '../../../project/entities/project.entity';
import { ProjectMember } from '../../../project/entities/project-member.entity';
import {
  CreateChannelDto,
  ChannelCreateDto,
  ChannelResponseDto,
  ChannelListDto,
  ChannelUserListDto,
  unreadChannelListDto,
} from '../../dto';
import { ChannelKind, AccessType, MemberRole, MemberStatus, ChannelKindLowcase, AccessTypeLowcase } from '../../../../common/enums';

@Injectable()
export class ChannelServiceImpl extends ChannelService {
  private readonly springBaseUrl: string;
  private readonly internalSecret: string;
  private readonly logger = new Logger(ChannelServiceImpl.name);
  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly channelMemberRepository: ChannelMemberRepository,
    private readonly channelNotificationService: ChannelNotificationService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    super();
    this.springBaseUrl = this.configService.get(
      'SPRING_BASE_URL',
      'http://localhost:8080',
    );
    this.internalSecret = this.configService.get(
      'INTERNAL_SECRET',
      'NeedApiKey',
    );
  }

  /**
   * 1. 채널 생성
   */
  async createChannel(
    dto: CreateChannelDto,
    projectPk: number,
    creatorUserPk: number,
  ): Promise<ChannelCreateDto> {

    // 엔티티 타입으로 캐스팅 -> dto의 channelKind와 accessType은 소문자로 되어있는데 이거를 엔티티에 맞게(엔티티는 대문자로 되어있음) 맞춰주는 것
    const kindEnum = dto.channelKind.toUpperCase() as Channel['channelKind'];
    const accessEnum = dto.accessType.toUpperCase() as Channel['accessType'];

    const project = await this.projectRepository.findOne({
      where: { projectPk, isDeletedProject: false },
    });
    if (!project)
      throw new NotFoundException(
        `프로젝트 ID ${projectPk}를 찾을 수 없습니다.`,
      );

    const projectMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: creatorUserPk },
    });
    if (!projectMember)
      throw new ForbiddenException('프로젝트 멤버가 아닙니다.');

    if (
      kindEnum === ChannelKind.NOTIFICATION &&
      projectMember.projectRole !== 'admin'
    ) {
      throw new ForbiddenException(
        '공지 채널은 프로젝트 관리자만 생성할 수 있습니다.',
      );
    }

    const existing = await this.channelRepository.findOne({
      projectPk,
      channelName: dto.channelName,
    });
    if (existing)
      throw new ForbiddenException(
        `채널명 '${dto.channelName}'이 이미 존재합니다.`,
      );

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // 채널 생성
      const savedChannel = await queryRunner.manager.save(Channel, {
        projectPk,
        channelName: dto.channelName,
        channelKind: kindEnum,
        accessType: accessEnum,
      });
  
      let creatorRole: 'admin' | 'member' = 'member';
  
      if (savedChannel.accessType === AccessType.PRIVATE) {
        // 비공개 채널: 생성자만 admin으로 추가
        await queryRunner.manager.save(ChannelMember, {
          channelPk: savedChannel.channelPk,
          userPk: creatorUserPk,
          cStatus: MemberStatus.ACTIVE,
          channelRole: MemberRole.ADMIN,
        });
        creatorRole = 'admin';
      } else {
        // 공개/공지 채널: 모든 프로젝트 멤버 추가
        const pMembers = await this.projectMemberRepository.find({
          where: { projectPk, pStatus: 'Active' },
        });
  
        const channelMembers = pMembers.map(
          (pm) => ({
            channelPk: savedChannel.channelPk,
            userPk: pm.userPk,
            cStatus: MemberStatus.ACTIVE,
            channelRole: pm.projectRole === 'admin' ? MemberRole.ADMIN : MemberRole.MEMBER,
          }),
        );
  
        await queryRunner.manager.save(ChannelMember, channelMembers);
        
        const myMember = channelMembers.find((m) => m.userPk === creatorUserPk);
        creatorRole = (myMember?.channelRole as 'admin' | 'member') || 'member';
      }

      await queryRunner.commitTransaction(); //트랜잭션 커밋
      
      this.channelNotificationService.notifyChannelAdded(
        savedChannel.channelPk,
        savedChannel.channelName,
        projectPk,
      );
  
      return {
        channelPk: savedChannel.channelPk,
        channelName: savedChannel.channelName,
        channelKind: dto.channelKind,
        accessType: dto.accessType,
        channelRole: creatorRole,
      };
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`채널 생성이 실패했습니다. 다시 시도해 주세요.`)
    } finally {
      // 트랜잭션 종료
      await queryRunner.release();
    }
  }

  /**
   * 2. 프로젝트 내 채널 목록 조회
   */
  async getChannelsByProject(
    projectPk: number,
    requestUserPk: number,
  ): Promise<ChannelListDto[]> {

    const isMember = await this.projectMemberRepository.findOne({
      where: { projectPk, userPk: requestUserPk },
    });
    if (!isMember) throw new ForbiddenException('프로젝트 멤버가 아닙니다.');

    const channels =
      await this.channelRepository.findAccessibleChannelsInProject(
        projectPk,
        requestUserPk,
      );
    
    const channelPks = channels.map(c => c.channelPk);
    
    const unreadInfo = await this.getUnreadChannels(channelPks, requestUserPk)

    return channels.map((channel) => {
      const myMember = channel.channelMembers?.find(
        (m) => m.userPk === requestUserPk && m.cStatus === 'Active',
      );
      const unread = unreadInfo.find(u => u.channelPk === channel.channelPk);

      return {
        channelPk: channel.channelPk,
        channelName: channel.channelName,
        channelKind: channel.channelKind.toLowerCase() as ChannelKindLowcase,
        accessType: channel.accessType.toLowerCase() as AccessTypeLowcase,
        channelRole: (myMember?.channelRole as 'admin' | 'member') || 'member',
        hasUnread: unread ? unread.hasUnread : false,
      };
    });
  }

  /**
   * 3. 단일 채널 상세 조회
   */
  async getChannelById(channelPk: number): Promise<ChannelResponseDto> {
    const channel = await this.channelRepository.findOne({ channelPk }, [
      'channelMembers',
      'channelMembers.user',
      'project',
    ]);
    if (!channel)
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다.`);

    const admin = channel.channelMembers.find((m) => m.channelRole === 'admin');

    return {
      channelPk: channel.channelPk,
      projectPk: channel.projectPk,
      channelName: channel.channelName,
      channelKind: channel.channelKind.toLowerCase() as ChannelKindLowcase,
      isDeletedChannel: channel.isDeletedChannel,
      accessType: channel.accessType.toLowerCase() as AccessTypeLowcase,
      projectInfo: {
        projectPk: channel.project.projectPk,
        projectName: channel.project.projectName,
      },
      adminInfo: admin ? { userName: admin.user.userName } : undefined,
    };
  }

  /**
   * 4. 유저가 속한 모든 채널 조회
   */
  async getAllChannelsForUser(userPk: number): Promise<ChannelUserListDto[]> {
    const channels =
      await this.channelRepository.findAccessibleChannels(userPk);
    return channels.map((c) => ({
      channelPk: c.channelPk,
      channelName: c.channelName,
    }));
  }

  /**
   * 5. 채널 정보(이름) 수정
   */
  async updateChannel(
    projectPk: number,
    channelPk: number,
    newChannelName: string,
    modifierUserPk: number,
  ): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      channelPk,
      projectPk,
    });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const member = await this.channelMemberRepository.findOne({
      channelPk,
      userPk: modifierUserPk,
      cStatus: MemberStatus.ACTIVE,
    });
    if (!member || member.channelRole !== 'admin')
      throw new ForbiddenException('수정 권한이 없습니다.');

    channel.channelName = newChannelName;
    const updated = await this.channelRepository.save(channel);

    this.channelNotificationService.notifyChannelUpdated(
      updated.channelPk,
      updated.channelName,
      projectPk,
    );
    return updated;
  }

  /**
   * 6. 채널 삭제
   */
  async deleteChannel(channelPk: number, userPk: number): Promise<void> {
    const channel = await this.channelRepository.findOne({ channelPk });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const member = await this.channelMemberRepository.findOne({
      channelPk,
      userPk,
      channelRole: MemberRole.ADMIN,
    });

    if (!member) throw new UnauthorizedException('삭제 권한이 없습니다.');

    await this.channelMemberRepository.deactivateAllInChannel(channelPk);
    await this.channelRepository.delete(channelPk);

    this.channelNotificationService.notifyChannelRemoved(
      channel.channelPk,
      channel.channelName,
      channel.projectPk,
    );
  }

  /**
   * 7. 화상채널인지 아닌지 검사
   */
  async validateChannelKind(
    channelPk: number,
  ): Promise<{ isValid: boolean; channelKind?: string }> {
    const channel = await this.channelRepository.findOne({ channelPk });
    if (!channel) return { isValid: false };

    return {
      isValid: channel.channelKind === ChannelKind.VOICE,
      channelKind: channel.channelKind,
    };
  }

  /**
   * 안읽음 정보를 받아오는 내부 API
  */
  private async getUnreadChannels(
    channelPks: number[],
    userPk: number
  ): Promise<unreadChannelListDto[]> {
     try {
      const response = await fetch(
        `${this.springBaseUrl}/api/jv/internal/channels/unread`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': this.internalSecret,
          },
          body: JSON.stringify({ channelPks, userPk }),
        },
      );

      if (!response.ok) {
        this.logger.error(`Channel Unread Info HTTP error! status: ${response.status}`);
        throw new InternalServerErrorException(`채널에서 읽지 않은 메세지 목록을 불러올 수 없습니다.`);
      }

    return await response.json() as unreadChannelListDto[];

    } catch (error) {
      throw new InternalServerErrorException(`내부 서버 통신 실패`)
    }
  }
}
