import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { Channel } from "../../entities/channel.entity";
import { ChannelRepository } from "../channel.repository";

@Injectable()
export class TypeOrmChannelRepository extends ChannelRepository {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {
    super();
  }

  async findOne(
    options: { channelPk?: number; projectPk?: number; channelName?: string },
    relations? : string[]
  ): Promise<Channel | null> {
    const { channelPk, projectPk, channelName } = options;

    return this.channelRepository.findOne({
      where: {
        ...(channelPk && { channelPk }), // ** 1
        ...(projectPk && { projectPk }),
        ...(channelName && { channelName }),
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
      .leftJoinAndSelect('channel.channelMembers', 'channelMember')
      .where('channel.projectPk = :projectPk', { projectPk })
      .andWhere('channel.isDeletedChannel = false')
      .andWhere(
        // '(channel.accessType = \'PUBLIC\' OR (channel.accessType = \'PRIVATE\' AND channelMember.userPk = :userPk AND channelMember.cStatus = :activeStatus))',
        //   { userPk: userPk, activeStatus: 'Active' },
        new Brackets((qb) => {
          qb.where('channel.accessType = :public', {public: 'PUBLIC'})
            .orWhere(
              '(channel.accessType = :private AND channelMember.userPk = :userPk AND channelMember.cStatus = :activeStatus)', 
              { private: 'PRIVATE', userPk, activeStatus: 'Active' },
            );
        })
      ).getMany();
      // Brackets -->TypeORM의 QueryBuilder에서 SQL의 '괄호 ( )'를 묶어주는 도구
      // 쓰는 이유
      // 1. 가독성: 문자열이 너무 길어지면 \' 같은 이스케이프 문자가 많아져서 읽기 힘듬
      // 2. 유연성: if 문에 따라 괄호 안의 조건을 동적으로 추가하거나 뺄 때 Brackets가 훨씬 편함
      // 3. 안전성: 실수로 괄호를 덜 닫는 등의 실수를 방지함
  }

  async findAccessibleChannels(
    userPk: number
  ): Promise<Channel[]> {
    return this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.channelMembers', 'channelMember', 'channelMember.userPk = :userPk', { userPk })
      .where('channel.isDeletedChannel = false')
      .andWhere(
        new Brackets((qb) => {
          qb.where('channel.accessType = :public', { public: 'PUBLIC' })
            .orWhere('channelMember.userPk = :userPk AND channelMember.cStatus = :active', 
              { userPk, active: 'Active' }
            );
        })
      ).getMany();
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

  async save(channel: Partial<Channel>): Promise<Channel> {

    const saveChannel: Partial<Channel> = {
      ...channel,
      ...(channel.channelKind && {channelKind: channel.channelKind.toUpperCase() as any}),
      ...(channel.accessType && { accessType: channel.accessType.toUpperCase() as any }),
    };

    return this.channelRepository.save(saveChannel);
  }

  async delete(channelPk: number): Promise<void> {
    await this.channelRepository.update(channelPk, { isDeletedChannel: true })
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