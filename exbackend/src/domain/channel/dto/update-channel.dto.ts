import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class UpdateChannelDto {
  @ApiProperty({ description: '새로운 채널명', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  @IsNotEmpty()
  channelName: string;
}
