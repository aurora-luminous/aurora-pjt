import { ChannelMember } from "../entities/channel-member.entity";

export abstract class ChannelMemberRepository {

  // 채널 멤버 조회
  abstract findOne(
    options: {
      channelMemberPk?: number;
      channelPk?: number;
      userPk?: number;
      cStatus?: 'Active' | 'Inactive' | 'Banned';
      channelRole?: 'admin' | 'member';
    },
    relations?: string[]
  ): Promise<ChannelMember | null>;

  // 채널 멤버 목록 조회
  abstract findAll(
    options: {
      channelPk?: number;
      userPk?: number;
      cStatus?: 'Active' | 'Inactive' | 'Banned';
    },
    relations?: string[],
    order?: { [key: string]: 'ASC' | 'DESC' }
  ): Promise<ChannelMember[]>;

  // 멤버 수 체크
  abstract count(
    options: {
      channelPk: number;
      cStatus?: 'Active' | 'Inactive' | 'Banned';
      channelRole?: 'admin' | 'member';
    }
  ): Promise<number>;

  // 저장 및 업데이트
  abstract save(member: Partial<ChannelMember>): Promise<ChannelMember>;

  // 멤버 일괄 저장 (공개, 공지 채널)
  abstract saveMany(members: Partial<ChannelMember>[]): Promise<ChannelMember[]>;

  // 멤버 일괄 삭제
  abstract deactivateAllInChannel(channelPk: number): Promise<void>;
}