import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Brackets } from "typeorm";
import { ChannelMember } from "../../entities/channel-member.entity";
import { ChannelMemberRepository } from "../channel-member.repository";
import { EntityManager } from "typeorm";
import { MemberStatus, MemberRole } from "src/common/enums";

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

  // 특정 서버에 속한 모든 프로젝트의 모든 채널 멤버 나가기 처리
  async deactivateAllByServer(manager: EntityManager, serverPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ChannelMember)
      .set({ cStatus: MemberStatus.INACTIVE })
      .where('cStatus = :status', { status: MemberStatus.ACTIVE })
      .andWhere('channelPk IN (SELECT c.channel_pk FROM channel c JOIN project p ON c.project_pk = p.project_pk WHERE p.server_pk = :serverPk)', { serverPk })
      .execute();
  }

  // 특정 프로젝트의 모든 채널 멤버 나가기 처리
  async deactivateAllByProject(manager: EntityManager, projectPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ChannelMember)
      .set({ cStatus: MemberStatus.INACTIVE })
      .where('cStatus = :status', { status: MemberStatus.ACTIVE })
      .andWhere('channelPk IN (SELECT channel_pk FROM channel WHERE project_pk = :projectPk)', { projectPk })
      .execute();
  }

  // 유저가 가입중인 프로젝트의 모든 채널에서 나가기 처리
  async deactivateUserInProject(manager: EntityManager, projectPk: number, userPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ChannelMember)
      .set({ cStatus: MemberStatus.INACTIVE })
      .where('userPk = :userPk', { userPk })
      .andWhere('cStatus = :status', { status: MemberStatus.ACTIVE })
      .andWhere('channelPk IN (SELECT channel_pk FROM channel WHERE project_pk = :projectPk)', { projectPk })
      .execute();
  }
  // 유저가 가입중인 서버의 모든 프로젝트의 모든 채널에서 나가기 처리
  async deactivateUserInServer(manager: EntityManager, serverPk: number, userPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ChannelMember)
      .set({ cStatus: MemberStatus.INACTIVE })
      .where('userPk = :userPk', { userPk })
      .andWhere('cStatus = :status', { status: MemberStatus.ACTIVE })
      .andWhere('channelPk IN (SELECT c.channel_pk FROM channel c JOIN project p ON c.project_pk = p.project_pk WHERE p.server_pk = :serverPk)', { serverPk })
      .execute();
  }

  // 특정 프로젝트의 모든 Public 채널에 유저를 일괄 가입 처리
  async addAllToPublicChannelsInProject(manager: EntityManager, projectPk: number, userPk: number): Promise<void> {
    // 1. 해당 프로젝트의 모든 PUBLIC 채널 중 유저가 아직 가입하지 않은 채널 PK 목록 조회
    const subQuery = manager
      .createQueryBuilder()
      .select('c.channel_pk')
      .from('channel', 'c')
      .leftJoin('channel_member', 'cm', 'cm.channel_pk = c.channel_pk AND cm.user_pk = :userPk', { userPk })
      .where('c.project_pk = :projectPk', { projectPk })
      .andWhere('c.access_type = :accessType', { accessType: 'PUBLIC' })
      .andWhere('c.is_deleted_channel = :isDeleted', { isDeleted: false })
      .andWhere('cm.channel_member_pk IS NULL');

    const channels = await subQuery.getRawMany();
    
    if (channels.length === 0) return;

    // 2. 가입 처리
    const newMembers = channels.map(c => ({
      channelPk: c.channel_pk,
      userPk: userPk,
      cStatus: MemberStatus.ACTIVE,
      channelRole: MemberRole.MEMBER,
    }));

    await manager.getRepository(ChannelMember).insert(newMembers);
  }
}