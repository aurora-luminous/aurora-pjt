import { Channel } from "../entities/channel.entity";
import { EntityManager } from "typeorm";

export abstract class ChannelRepository {

  // 단일 채널 조회 (프로젝트, 채널멤버 정보 옵션)
  abstract findOne(
    options: { channelPk?: number; projectPk?: number; channelName?: string },
    relations? : string[]
  ): Promise<Channel | null>

  // 프로젝트 안에서 유저가 접근 가능한 채널 목록 조회
  abstract findAccessibleChannelsInProject(
    projectPk: number,
    userPk: number
  ): Promise<Channel[]>;

  // 유저가 접근 가능한 모든 채널 목록 조회
  abstract findAccessibleChannels(
    userPk: number
  ): Promise<Channel[]>;

  // 프로젝트 내 공개 채널 목록 조회
  abstract findPublicChannels(
    projectPk: number
  ): Promise<Channel[]>;

  // 프로젝트에 속한 모든 채널 목록 조회
  abstract findChannelsInProject(
    projectPk: number
  ): Promise<Channel[]>;

  // 채널 생성 및 업데이트
  abstract save(channel: Partial<Channel>): Promise<Channel>;

  // 채널 삭제
  abstract delete(channelPk: number): Promise<void>;

  // 특정 프로젝트의 모든 채널 삭제
  abstract deleteAllByProject(manager: EntityManager, projectPk: number): Promise<void>;

  // 특정 서버의 모든 채널 삭제
  abstract deleteAllByServer(manager: EntityManager, serverPk: number): Promise<void>;
}