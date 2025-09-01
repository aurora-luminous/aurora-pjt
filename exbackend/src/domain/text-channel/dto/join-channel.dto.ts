import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinChannelDto {
  @ApiProperty({ 
    description: '채널 기본키',
    example: 1
  })
  @IsNumber()
  channelPk: number;

  @ApiProperty({ 
    description: '참가할 사용자 기본키',
    example: 1
  })
  @IsNumber()
  userPk: number;
}