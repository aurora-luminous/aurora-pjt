import { CreateChannelDto, ChannelResponseDto, ChannelListDto, ChannelUserListDto } from "../dto";
import { Channel } from '../entities/channel.entity';

export abstract class ChannelService {

  // 채널 생성
  abstract createChannel(
    createChannelDto: CreateChannelDto,
    projectPk: number,
    creatorUserPk: number,
  ): Promise<any>;

  // 프로젝트 내 채널 목록 조회
  abstract getChannelsByProject(
    projectPk: number,
    requestUserPk?: number,
  ): Promise<ChannelListDto[]>;

  // 단일 채널 상세 조회
  abstract getChannelById(channelPk: number): Promise<ChannelResponseDto>;

  // 유저가 속한 모든 채널 조회
  abstract getAllChannelsForUser(userPk: number): Promise<ChannelUserListDto[]>;

  // 채널 정보(이름) 수정
  abstract updateChannel(
    projectPk: number,
    channelPk: number,
    newChannelName: string,
    modifierUserPk: number,
  ): Promise<Channel>;

  // 채널 삭제
  abstract deleteChannel(ChannelPk: number, userPk: number): Promise<void>;

  // 화상채널인지 아닌지 검사
  abstract validateChannelKind(channelPk: number): Promise<{ isValid: boolean; channelKind?: string }>;
}