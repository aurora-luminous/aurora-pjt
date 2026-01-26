import { IsNotEmpty, IsObject, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { types } from 'mediasoup';

type RtpCapabilities = types.RtpCapabilities;
type DtlsParameters = types.DtlsParameters;
type RtpParameters = types.RtpParameters;

/**
 * Router의 RTP Capabilities 요청 DTO
 */
export class GetRouterRtpCapabilitiesDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;
}

/**
 * WebRTC Transport 생성 요청 DTO
 */
export class CreateWebRtcTransportDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: '송신용 Transport인지 (true: send, false: recv)', default: true })
  @IsOptional()
  @IsBoolean()
  producing?: boolean;

  @ApiProperty({ description: '수신용 Transport인지 (true: recv, false: send)', default: true })
  @IsOptional()
  @IsBoolean()
  consuming?: boolean;
}

/**
 * WebRTC Transport 연결 DTO
 */
export class ConnectWebRtcTransportDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Transport ID' })
  @IsNotEmpty()
  @IsString()
  transportId: string;

  @ApiProperty({ description: 'DTLS Parameters' })
  @IsNotEmpty()
  @IsObject()
  dtlsParameters: DtlsParameters;
}

/**
 * Producer 생성 DTO (미디어 전송)
 */
export class CreateProducerDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Transport ID' })
  @IsNotEmpty()
  @IsString()
  transportId: string;

  @ApiProperty({ description: '미디어 종류 (audio/video)' })
  @IsNotEmpty()
  @IsString()
  kind: 'audio' | 'video';

  @ApiProperty({ description: 'RTP Parameters' })
  @IsNotEmpty()
  @IsObject()
  rtpParameters: RtpParameters;

  @ApiProperty({ description: 'App 데이터 (선택)', required: false })
  @IsOptional()
  @IsObject()
  appData?: any;
}

/**
 * Consumer 생성 요청 DTO (미디어 수신)
 */
export class CreateConsumerDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Transport ID' })
  @IsNotEmpty()
  @IsString()
  transportId: string;

  @ApiProperty({ description: 'Producer ID (수신할 미디어의 Producer)' })
  @IsNotEmpty()
  @IsString()
  producerId: string;

  @ApiProperty({ description: 'RTP Capabilities' })
  @IsNotEmpty()
  @IsObject()
  rtpCapabilities: RtpCapabilities;
}

/**
 * Producer 닫기 DTO
 */
export class CloseProducerDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Producer ID' })
  @IsNotEmpty()
  @IsString()
  producerId: string;
}

/**
 * Consumer 닫기 DTO
 */
export class CloseConsumerDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Consumer ID' })
  @IsNotEmpty()
  @IsString()
  consumerId: string;
}

/**
 * Consumer Resume DTO (미디어 수신 재개)
 */
export class ResumeConsumerDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Consumer ID' })
  @IsNotEmpty()
  @IsString()
  consumerId: string;
}

/**
 * Consumer Pause DTO (미디어 수신 일시정지)
 */
export class PauseConsumerDto {
  @ApiProperty({ description: '채널 PK' })
  @IsNotEmpty()
  channelPk: number;

  @ApiProperty({ description: 'Consumer ID' })
  @IsNotEmpty()
  @IsString()
  consumerId: string;
}
