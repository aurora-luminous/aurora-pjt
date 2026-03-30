import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsNotEmpty, IsOptional, IsEnum, IsBoolean, Length } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ description: '채널명', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  @IsNotEmpty()
  channelName: string;

  @ApiProperty({ description: '채널 종류', enum: ['text', 'voice', 'notification'] })
  @IsEnum(['text', 'voice', 'notification'])
  channelKind: 'text' | 'voice' | 'notification';

  @ApiProperty({ description: '채널 접근 유형', enum: ['public', 'private'] })
  @IsEnum(['public', 'private'])
  accessType: 'public' | 'private';


}