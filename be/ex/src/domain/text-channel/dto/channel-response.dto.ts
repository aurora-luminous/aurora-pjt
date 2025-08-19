import { ApiProperty } from '@nestjs/swagger';

export class ChannelResponseDto {
  @ApiProperty({ description: '채널 PK' })
  channelPk: number;

  @ApiProperty({ description: '프로젝트 PK' })
  projectPk: number;

  @ApiProperty({ description: '채널명' })
  channelName: string;

  @ApiProperty({ description: '채널 종류', enum: ['TEXT', 'VOICE', 'VIDEO'] })
  channelKind: 'TEXT' | 'VOICE' | 'VIDEO';

  @ApiProperty({ description: '채널 삭제 여부' })
  isDeletedChannel: boolean;

  @ApiProperty({ description: '비공개 채널 여부' })
  isPrivate: boolean;

  @ApiProperty({ description: '프로젝트 정보', required: false })
  projectInfo?: {
    projectPk: number;
    projectName: string;
  };

  @ApiProperty({ description: '채널 소유자 정보', required: false })
  ownerInfo?: {
    userName: string;
  };
}

// 채널 목록/생성 응답용 (사용자 역할 포함)
export class ChannelListDto {
  @ApiProperty({ description: '채널명' })
  channelName: string;

  @ApiProperty({ description: '채널 종류', enum: ['text', 'voice'] })
  channelKind: 'text' | 'voice';

  @ApiProperty({ description: '비공개 채널 여부' })
  isPrivate: boolean;

  @ApiProperty({ description: '채널에서의 사용자 역할', enum: ['admin', 'member'] })
  channelRole: 'admin' | 'member';
}