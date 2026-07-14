import { ChannelMember } from "../entities/channel-member.entity";
import { EntityManager } from "typeorm";

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

  // 특정 서버의 모든 채널 멤버 나가기 처리
  abstract deactivateAllByServer(manager: EntityManager, serverPk: number): Promise<void>;

  // 특정 프로젝트의 모든 채널 멤버 나가기 처리
  abstract deactivateAllByProject(manager: EntityManager, projectPk: number): Promise<void>;

  // 유저가 가입중인 프로젝트의 모든 채널에서 나가기 처리
  abstract deactivateUserInProject(manager: EntityManager, projectPk: number, userPk: number): Promise<void>;

  // 유저가 가입중인 서버의 모든 프로젝트의 모든 채널에서 나가기 처리
  abstract deactivateUserInServer(manager: EntityManager, serverPk: number, userPk: number): Promise<void>;

  // 특정 프로젝트의 모든 Public 채널에 유저를 일괄 가입 처리
  abstract addAllToPublicChannelsInProject(manager: EntityManager, projectPk: number, userPk: number): Promise<void>;
}