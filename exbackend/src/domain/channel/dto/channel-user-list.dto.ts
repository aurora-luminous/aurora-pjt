import { ApiProperty } from '@nestjs/swagger';

export class ChannelUserListDto {
  @ApiProperty({ description: '채널 기본키' })
  channelPk: number;

  @ApiProperty({ description: '채널 이름' })
  channelName: string;
}
