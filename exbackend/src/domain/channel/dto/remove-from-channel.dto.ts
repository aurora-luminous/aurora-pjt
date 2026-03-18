import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveFromChannelDto {
  @ApiProperty({ 
    description: '채널 기본키',
    example: 1
  })
  @IsNumber()
  channelPk: number;

  @ApiProperty({ 
    description: '제거할 사용자 기본키',
    example: 2
  })
  @IsNumber()
  targetUserPk: number;

  @ApiProperty({ 
    description: '관리자 사용자 기본키',
    example: 1
  })
  @IsNumber()
  adminUserPk: number;
}