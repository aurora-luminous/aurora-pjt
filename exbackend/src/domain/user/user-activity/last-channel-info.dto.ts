import { ApiProperty } from '@nestjs/swagger';

export class LastChannelInfoDto {
  @ApiProperty({ description: '서버 URL' })
  serverUrl: string;

  @ApiProperty({ description: '프로젝트 기본키' })
  projectPk: number;

  @ApiProperty({ description: '채널 기본키' })
  channelPk: number;
}
