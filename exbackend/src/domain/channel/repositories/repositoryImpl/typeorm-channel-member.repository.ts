import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Brackets } from "typeorm";
import { ChannelMember } from "../../entities/channel-member.entity";
import { ChannelMemberRepository } from "../channel-member.repository";

@Injectable()
export class TypeOrmChannelMemberRepository extends ChannelMemberRepository {
  constructor (
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
  ) {
    super();
  }

  async findOne(
    options: {
      channelMemberPk?: number;
      channelPk?: number;
      userPk?: number;
      cStatus?: 'Active' | 'Inactive' | 'Banned';
      channelRole?: 'admin' | 'member';
    },
    relations?: string[]
  ): Promise<ChannelMember | null> {
    const { channelMemberPk, channelPk, userPk, cStatus, channelRole } = options;

    return this.channelMemberRepository.findOne({
      where: {
        ...(channelMemberPk && { channelMemberPk }),
        ...(channelPk && { channelPk }),
        ...(userPk && {userPk}),
        ...(cStatus && { cStatus }),
        ...(channelRole && { channelRole }),
      },
      relations: relations || [],
    });
  };

  async findAll(
    options: {
      channelPk?: number;
      userPk?: number;
      cStatus?: 'Active' | 'Inactive' | 'Banned';
    },
    relations?: string[],
    order?: { [key: string]: 'ASC' | 'DESC' }
  ): Promise<ChannelMember[]> {

    const { channelPk, userPk, cStatus } = options;

    return this.channelMemberRepository.find({
      where: {
        ...(channelPk && { channelPk }),
        ...(userPk && { userPk }),
        ...( cStatus && { cStatus }),
      },
      relations: relations || [],
      order: order || { channelMemberPk: 'ASC' },
    });
  };

  async count(
    options: {
      channelPk: number;
      cStatus?: 'Active' | 'Inactive' | 'Banned';
      channelRole?: 'admin' | 'member';
    }
  ): Promise<number> {
    const { channelPk, cStatus, channelRole } = options;

    return this.channelMemberRepository.count({
      where : {
        channelPk,
        ...(cStatus && { cStatus }),
        ...(channelRole && { channelRole }),
      },
    });
  };


  async save(member: Partial<ChannelMember>): Promise<ChannelMember> {
    return this.channelMemberRepository.save(member);
  };


  async saveMany(members: Partial<ChannelMember>[]): Promise<ChannelMember[]> {
    return this.channelMemberRepository.save(members);
  };


  async deactivateAllInChannel(channelPk: number): Promise<void> {
    await this.channelMemberRepository.update(
      { channelPk: channelPk },
      { cStatus: 'Inactive' }
    );
  };
}