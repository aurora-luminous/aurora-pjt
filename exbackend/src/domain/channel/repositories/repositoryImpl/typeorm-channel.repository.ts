import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Channel } from "../../entities/channel.entity";
import { ChannelRepository } from "../channel.repository";
import { ChannelKind, AccessType, MemberStatus } from "../../../../common/enums";
import { EntityManager } from "typeorm";

@Injectable()
export class TypeOrmChannelRepository extends ChannelRepository {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {
    super();
  }

  async findOne(
    options: { channelPk?: number; projectPk?: number; channelName?: string ,isDefault?: boolean },
    relations? : string[]
  ): Promise<Channel | null> {
    const { channelPk, projectPk, channelName, isDefault } = options;

    return this.channelRepository.findOne({
      where: {
        ...(channelPk && { channelPk }), // ** 1
        ...(projectPk && { projectPk }),
        ...(channelName && { channelName }),
        ...(isDefault && { isDefault }),
        isDeletedChannel: false,
      },
      relations: relations || []
    })
  }

  async findAccessibleChannelsInProject(
    projectPk: number,
    userPk: number
  ): Promise<Channel[]> {

    return this.channelRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect(
        'channel.channelMembers', 
        'channelMember',
        'channelMember.userPk = :userPk AND channelMember.cStatus = :active',
        { userPk, active: MemberStatus.ACTIVE }
      )
      .where('channel.projectPk = :projectPk', { projectPk })
      .andWhere('channel.isDeletedChannel = false')
      .getMany();
  }

  async findAccessibleChannels(
    userPk: number
  ): Promise<Channel[]> {
    return this.channelRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect(
        'channel.channelMembers', 
        'channelMember', 
        'channelMember.userPk = :userPk AND channelMember.cStatus = :active', 
        { userPk, active: MemberStatus.ACTIVE })
      .where('channel.isDeletedChannel = false')
      .getMany();
  }

  async findPublicChannels(projectPk: number): Promise<Channel[]> {
    return this.channelRepository.find({
      where: {
        projectPk,
        accessType: 'PUBLIC',
        isDeletedChannel: false,
      },
    });
  }

  async findChannelsInProject(
    projectPk: number
  ): Promise<Channel[]> {
    return this.channelRepository.find({
      where: {
        projectPk,
        isDeletedChannel: false,
      },
    });
  }

  async save(channel: Partial<Channel>): Promise<Channel> {

    const saveChannel: Partial<Channel> = {
      ...channel,
      ...(channel.channelKind && {channelKind: channel.channelKind.toUpperCase() as ChannelKind}),
      ...(channel.accessType && { accessType: channel.accessType.toUpperCase() as AccessType }),
    };

    return this.channelRepository.save(saveChannel);
  }

  async delete(channelPk: number): Promise<void> {
    await this.channelRepository.update(channelPk, { isDeletedChannel: true })
  }

  // 특정 서버의 모든 채널 삭제
  async deleteAllByServer(manager: EntityManager, serverPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(Channel)
      .set({ isDeletedChannel: true })
      .where('projectPk IN (SELECT project_pk FROM project WHERE server_pk = :serverPk)', { serverPk })
      .execute();
  }

  // 특정 프로젝트의 모든 채널 삭제
  async deleteAllByProject(manager: EntityManager, projectPk: number): Promise<void> {
    await manager.update(Channel,
      { projectPk, isDeletedChannel: false },
      { isDeletedChannel: true }
    );
  }
}

/*
  ** 1
  where {
  ...(channelPk && { channelPk })
  }

  아래 코드와 같음
  const  where = {};
  if (channelPk) {
    where.channelPk = channelPk;
  }
*/