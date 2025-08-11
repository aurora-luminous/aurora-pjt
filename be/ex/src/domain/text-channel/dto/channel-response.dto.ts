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
    userPk: number;
    userName: string;
  };
}