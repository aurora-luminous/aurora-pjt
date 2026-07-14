import { IsString, IsNotEmpty, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SignalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice-candidate',
}

export class WebRtcSignalDto {
  @ApiProperty({ enum: SignalType, description: 'Signal 타입' })
  @IsEnum(SignalType)
  type: SignalType;

  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Signal 데이터 (SDP 또는 ICE candidate)' })
  @IsObject()
  data: any;

  @ApiProperty({ description: '대상 사용자 PK (optional)', required: false })
  targetUserPk?: number;
}

export class JoinVoiceChannelDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;
}

export class LeaveVoiceChannelDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;
}