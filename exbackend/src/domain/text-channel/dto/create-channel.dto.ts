import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsNotEmpty, IsOptional, IsEnum, IsBoolean, Length } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ description: '채널명', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  @IsNotEmpty()
  channelName: string;

  @ApiProperty({ description: '프로젝트 PK' })
  @IsInt()
  @IsPositive()
  projectPk: number;

  @ApiProperty({ description: '채널 종류', enum: ['TEXT', 'VOICE', 'VIDEO'] })
  @IsEnum(['TEXT', 'VOICE', 'VIDEO'])
  channelKind: 'TEXT' | 'VOICE' | 'VIDEO';

  @ApiProperty({ description: '비공개 채널 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiProperty({ description: '채널 생성자 사용자 PK' })
  @IsInt()
  @IsPositive()
  creatorUserPk: number;
}