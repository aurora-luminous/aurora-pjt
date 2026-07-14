import { ApiProperty } from '@nestjs/swagger';
import {
  ChannelKindLowcase,
  AccessTypeLowcase,
} from '../../../common/enums/channel.enum';

/**
 * 기본 채널 응답 DTO (상세 조회용 등)
 */
export class ChannelResponseDto {
  @ApiProperty({ description: '채널 PK' })
  channelPk: number;

  @ApiProperty({ description: '프로젝트 PK' })
  projectPk: number;

  @ApiProperty({ description: '채널명' })
  channelName: string;

  @ApiProperty({
    description: '채널 종류',
    example: 'text',
    enum: ['text', 'voice', 'notification'],
  })
  channelKind: ChannelKindLowcase;

  @ApiProperty({ description: '채널 삭제 여부' })
  isDeletedChannel: boolean;

  @ApiProperty({
    description: '채널 접근 유형',
    example: 'public',
    enum: ['public', 'private'],
  })
  accessType: AccessTypeLowcase;

  @ApiProperty({ description: '프로젝트 정보', required: false })
  projectInfo?: {
    projectPk: number;
    projectName: string;
  };

  @ApiProperty({ description: '채널 관리자 정보', required: false })
  adminInfo?: {
    userName: string;
  };
}

/**
 * 채널 생성 응답용 DTO
 * (사용자의 역할 정보를 포함)
 */
export class ChannelCreateDto {
  @ApiProperty({ description: '채널 PK' })
  channelPk: number;

  @ApiProperty({ description: '채널명' })
  channelName: string;

  @ApiProperty({
    description: '채널 종류',
    enum: ['text', 'voice', 'notification'],
  })
  channelKind: ChannelKindLowcase;

  @ApiProperty({
    description: '채널 접근 유형',
    enum: ['public', 'private'],
  })
  accessType: AccessTypeLowcase;

  @ApiProperty({
    description: '채널에서의 사용자 역할',
    example: 'admin',
    enum: ['admin', 'member'],
  })
  channelRole: 'admin' | 'member';
}

/**
 * 채널 목록 조회 응답용 DTO
 */
export class ChannelListDto extends ChannelCreateDto {

  @ApiProperty({
    description: '채널에서의 안 읽은 메세지 여부',
  })
  hasUnread: boolean;
}

/**
 * 안 읽은 메세지 정보용 DTO
 */

export class unreadChannelListDto {
  @ApiProperty({ description: '채널 기본키' })
  channelPk: number;

  @ApiProperty({ description: '읽었는지 여부' })
  hasUnread: boolean;
}
