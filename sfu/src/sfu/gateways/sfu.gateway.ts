import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MediasoupService } from '../services/mediasoup.service';
import { RoomService } from '../services/room.service';


// WebSocket 연결에 사용자 정보 추가
interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  channelPk?: number;
}

@WebSocketGateway(3002, { path: '/voice' }) // ws://localhost:3002/voice
export class SfuGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SfuGateway');

  constructor(
    private readonly mediasoupService: MediasoupService,
    private readonly roomService: RoomService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 채널별 사용자 관리 (메모리)
  private channelUsers: Map<number, Set<number>> = new Map();
  // 사용자별 WebSocket 연결 관리
  private userSockets: Map<number, AuthenticatedSocket> = new Map();

  // 클라이언트 연결 시
  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.url}`);

    // TODO: 실제로는 JWT 토큰으로 사용자 인증
    // 테스트용으로 임시 userId 할당
    const tempUserId = Math.floor(Math.random() * 1000);
    client.userId = tempUserId;

    this.userSockets.set(tempUserId, client);
    this.logger.log(`User ${tempUserId} authenticated`);

    // 원시 메시지 핸들러 (NestJS @SubscribeMessage가 ws 라이브러리와 호환되지 않아 직접 구현)
    client.on('message', async (rawMessage: string) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        this.logger.debug(`Raw message received: ${JSON.stringify(message)}`);
        await this.handleRawMessage(client, message);
      } catch (error) {
        this.logger.error(`Failed to parse message: ${error.message}`);
      }
    });
  }

  // 클라이언트 연결 해제 시
  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    const channelPk = client.channelPk;


    if (userId) {
      this.userSockets.delete(userId);

      // 채널에서 사용자 제거
      if (channelPk && this.channelUsers.has(channelPk)) {
        const channelUserSet = this.channelUsers.get(channelPk);
        if (channelUserSet) {
          channelUserSet.delete(userId);

          // mediasoup 리소스 정리 (Transport, Producer, Consumer)
          await this.roomService.cleanupPeer(channelPk, userId);

          // 다른 사용자들에게 알림
          this.broadcastToChannel(channelPk, {
            event: 'user-left',
            userId,
            channelPk,
          }, userId);
        } else {
          this.logger.error(`Channel ${channelPk} user set not found during disconnect`);
        }
      }

      this.logger.log(`User ${userId} disconnected from channel ${channelPk}`);
    }
  }

  // 음성 채널 입장
  async handleJoinChannel(
    data: any,
    client: AuthenticatedSocket,
  ) {
    const channelPk = data?.channelPk;

    if (!channelPk) {
      this.logger.error(`Invalid data for join-channel`);
      return { event: 'error', message: 'Invalid data: missing channelPk' };
    }

    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    // 채널 검증: VOICE 또는 VIDEO 채널만 허용
    const isVoiceChannel = await this.validateVoiceChannel(channelPk);
    if (!isVoiceChannel) {
      this.logger.warn(`User ${userId} tried to join non-voice channel ${channelPk}`);
      return { event: 'error', message: 'This is not a voice/video channel' };
    }

    // 채널에 사용자 추가
    if (!this.channelUsers.has(channelPk)) {
      this.channelUsers.set(channelPk, new Set());
    }
    const channelUserSet = this.channelUsers.get(channelPk);
    if (channelUserSet) {
      channelUserSet.add(userId);
      client.channelPk = channelPk;
    } else {
      this.logger.error(`Failed to add user ${userId} to channel ${channelPk}`);
      return { event: 'error', message: 'Failed to join channel' };
    }

    this.logger.log(`User ${userId} joined channel ${channelPk}`);

    // 현재 채널에 있는 다른 사용자 목록 반환
    const channelUserSetForList = this.channelUsers.get(channelPk);
    const currentUsers = channelUserSetForList ? Array.from(channelUserSetForList) : [];

    // 새 사용자에게 현재 참가자 목록 전송
    client.send(JSON.stringify({
      event: 'channel-joined',
      channelPk,
      users: currentUsers.filter(id => id !== userId),
    }));

    // 다른 사용자들에게 새 참가자 알림
    this.broadcastToChannel(channelPk, {
      event: 'user-joined',
      userId,
      channelPk,
    }, userId);

    return { event: 'joined', channelPk, userId };
  }

  // 음성 채널 퇴장
  handleLeaveChannel(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk) {
      this.logger.error('Invalid data for leave-channel');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    if (this.channelUsers.has(channelPk)) {
      const channelUserSet = this.channelUsers.get(channelPk);
      if (channelUserSet) {
        channelUserSet.delete(userId);
      } else {
        this.logger.error(`Channel ${channelPk} user set not found during leave`);
      }
    }
    client.channelPk = undefined;

    // 다른 사용자들에게 알림
    this.broadcastToChannel(channelPk, {
      event: 'user-left',
      userId,
      channelPk,
    }, userId);

    this.logger.log(`User ${userId} left channel ${channelPk}`);

    return { event: 'left', channelPk, userId };
  }

  // ========== mediasoup SFU 시그널링 핸들러들 ==========

  // Router RTP Capabilities 요청
  async handleGetRouterRtpCapabilities(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk) {
      this.logger.error(`Invalid data for get-router-rtp-capabilities`);
      return { event: 'error', message: 'Invalid data: missing channelPk' };
    }

    const { channelPk } = data;
    const userId = client.userId;

    try {
      const rtpCapabilities = await this.mediasoupService.getRouterRtpCapabilities(channelPk);

      this.logger.log(`Router RTP capabilities sent to user ${userId} for channel ${channelPk}`);

      return {
        event: 'router-rtp-capabilities',
        rtpCapabilities,
      };
    } catch (error) {
      this.logger.error(`Failed to get router RTP capabilities: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // WebRTC Transport 생성
  async handleCreateWebRtcTransport(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk) {
      this.logger.error('Invalid data for create-webrtc-transport');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      const transportInfo = await this.roomService.createWebRtcTransport(channelPk, userId);

      this.logger.log(`Transport created for user ${userId} in channel ${channelPk}: ${transportInfo.id}`);

      return {
        event: 'webrtc-transport-created',
        ...transportInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to create transport: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // Transport 연결
  async handleConnectTransport(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk || !data.transportId || !data.dtlsParameters) {
      this.logger.error('Invalid data for connect-transport');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk, transportId, dtlsParameters } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      await this.roomService.connectTransport(channelPk, userId, transportId, dtlsParameters);

      this.logger.log(`Transport connected for user ${userId}: ${transportId}`);

      return { event: 'transport-connected', transportId };
    } catch (error) {
      this.logger.error(`Failed to connect transport: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // Producer 생성 (미디어 전송 시작)
  async handleProduce(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk || !data.transportId || !data.kind || !data.rtpParameters) {
      this.logger.error('Invalid data for produce');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk, transportId, kind, rtpParameters } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      const { id: producerId } = await this.roomService.createProducer(
        channelPk,
        userId,
        transportId,
        kind,
        rtpParameters,
      );

      this.logger.log(`Producer created for user ${userId} in channel ${channelPk}: ${producerId} (${kind})`);

      // 같은 채널의 다른 사용자들에게 새 Producer 알림
      this.broadcastToChannel(channelPk, {
        event: 'new-producer',
        userId,
        producerId,
        kind,
      }, userId);

      return { event: 'produced', producerId };
    } catch (error) {
      this.logger.error(`Failed to create producer: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // Consumer 생성 (다른 사용자의 미디어 수신)
  async handleConsume(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk || !data.transportId || !data.producerId || !data.rtpCapabilities) {
      this.logger.error('Invalid data for consume');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk, transportId, producerId, rtpCapabilities } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      const consumerInfo = await this.roomService.createConsumer(
        channelPk,
        userId,
        transportId,
        producerId,
        rtpCapabilities,
      );

      if (!consumerInfo) {
        return { event: 'error', message: 'Cannot consume this producer' };
      }

      this.logger.log(`Consumer created for user ${userId} in channel ${channelPk}: ${consumerInfo.id}`);

      return {
        event: 'consumed',
        ...consumerInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to create consumer: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // Consumer Resume (미디어 수신 재개)
  async handleResumeConsumer(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk || !data.consumerId) {
      this.logger.error('Invalid data for resume-consumer');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk, consumerId } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      await this.roomService.resumeConsumer(channelPk, userId, consumerId);

      this.logger.log(`Consumer resumed for user ${userId}: ${consumerId}`);

      return { event: 'consumer-resumed', consumerId };
    } catch (error) {
      this.logger.error(`Failed to resume consumer: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // Producer 닫기
  async handleCloseProducer(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk || !data.producerId) {
      this.logger.error('Invalid data for close-producer');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk, producerId } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      await this.roomService.closeProducer(channelPk, userId, producerId);

      // 다른 사용자들에게 Producer 닫힘 알림
      this.broadcastToChannel(channelPk, {
        event: 'producer-closed',
        userId,
        producerId,
      }, userId);

      this.logger.log(`Producer closed for user ${userId}: ${producerId}`);

      return { event: 'producer-closed', producerId };
    } catch (error) {
      this.logger.error(`Failed to close producer: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // 기존 Producer 목록 요청
  async handleGetProducers(
    data: any,
    client: AuthenticatedSocket,
  ) {
    if (!data || !data.channelPk) {
      this.logger.error('Invalid data for get-producers');
      return { event: 'error', message: 'Invalid data' };
    }

    const { channelPk } = data;
    const userId = client.userId;

    if (!userId) {
      return { event: 'error', message: 'User not authenticated' };
    }

    try {
      const producers = this.roomService.getProducersInRoom(channelPk, userId);

      this.logger.log(`Sent ${producers.length} producers to user ${userId} in channel ${channelPk}`);

      return {
        event: 'producers-list',
        producers,
      };
    } catch (error) {
      this.logger.error(`Failed to get producers: ${error.message}`);
      return { event: 'error', message: error.message };
    }
  }

  // ========== 헬퍼 메서드들 ==========

  /**
   * 원시 WebSocket 메시지 핸들러
   * NestJS의 @SubscribeMessage가 ws 라이브러리와 호환되지 않아
   * 직접 WebSocket 메시지를 파싱하고 라우팅합니다.
   */
  private async handleRawMessage(client: AuthenticatedSocket, message: any) {
    const { event, ...data } = message;

    try {
      let response: any;

      switch (event) {
        case 'join-channel':
          response = await this.handleJoinChannel(data, client);
          break;
        case 'leave-channel':
          response = await this.handleLeaveChannel(data, client);
          break;
        case 'get-router-rtp-capabilities':
          response = await this.handleGetRouterRtpCapabilities(data, client);
          break;
        case 'create-webrtc-transport':
          response = await this.handleCreateWebRtcTransport(data, client);
          break;
        case 'connect-transport':
          response = await this.handleConnectTransport(data, client);
          break;
        case 'produce':
          response = await this.handleProduce(data, client);
          break;
        case 'consume':
          response = await this.handleConsume(data, client);
          break;
        case 'resume-consumer':
          response = await this.handleResumeConsumer(data, client);
          break;
        case 'close-producer':
          response = await this.handleCloseProducer(data, client);
          break;
        case 'get-producers':
          response = await this.handleGetProducers(data, client);
          break;
        default:
          this.logger.warn(`Unknown event: ${event}`);
          response = { event: 'error', message: `Unknown event: ${event}` };
      }

      // 응답 전송
      if (response && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(response));
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: 'error', message: error.message }));
      }
    }
  }

  /**
   * 채널이 VOICE 또는 VIDEO 채널인지 검증
   */
  private async validateVoiceChannel(channelPk: number): Promise<boolean> {

    // 메인 서버 url
    const mainServerUrl = this.configService.get<string>('MAIN_SERVER_URL');

    // 메인 서버에 만들어야 할 채널 검증 API 엔드포인트
    const validationUrl = `${mainServerUrl}/channels/validate/${channelPk}`;

    try {
      this.logger.debug(`"${channelPk}" 채널이 "${validationUrl}"서버에서 유효한지 확인`);

      // 메인 서버에 API 호출
      const response = await firstValueFrom(
        this.httpService.get<{ isValid: boolean; channelKind?: 'TEXT' | 'VOICE'}>(validationUrl)
        /*
        this.httpService: @nestjs/axios 패키지에서 제공하는 HttpService 클래스의 인스턴스
        get<...> :  HTTP GET 요청 메서드. 제네릭<> 문을 통해 HTTP 요청의 응답 본문(response body)이 어떤 형식인지 알려줌
        () : GET 요청을 보낼 대상 URL
        */
      );

      const { isValid, channelKind } = response.data;

      if (!isValid) {
        this.logger.warn(`"${channelPk}" 채널을 찾을 수 없습니다.`);
        return false;
      }

      const isVoiceChannel = channelKind === 'VOICE';
      if (!isVoiceChannel) {
        this.logger.warn(`"${channelPk}" 채널은 VOICE 채널이 아닙니다.`);
      }

      return isVoiceChannel;
          
    } catch (error) {
      this.logger.error(`"${channelPk}"번 채널 검증 오류: ${error.message}`);
      return false;
    }
  }

  // 특정 채널의 모든 사용자에게 브로드캐스트 (발신자 제외)
  private broadcastToChannel(channelPk: number, message: any, excludeUserId?: number) {
    const users = this.channelUsers.get(channelPk);
    if (!users) return;

    users.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, message);
      }
    });
  }

  // 특정 사용자에게 메시지 전송
  private sendToUser(userId: number, message: any) {
    const socket = this.userSockets.get(userId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}