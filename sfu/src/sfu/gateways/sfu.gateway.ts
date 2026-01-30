import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws'; // ws 라이브러리에서 WebSocket을 명시적으로 임포트합니다.
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { MediasoupService } from '../services/mediasoup.service';
import { RoomService } from '../services/room.service';
import {
  verifyAndDecodeaccessToken,
  validatePayload,
} from './sfu.helperMethods'; // 헬퍼 함수

// WebSocket 연결에 사용자 정보 추가
interface AuthenticatedSocket extends WebSocket {
  userId?: number; // JWT에서 추출된 사용자 ID (number로 변환)
  channelPk?: number;
  accessToken?: string;
  clientId?: string; // 클라이언트 WebSocket 연결의 고유 ID (client.id 대체)
}

@WebSocketGateway(3002, { path: '/voice' }) // ws://localhost:3002/voice
export class SfuGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SfuGateway');
  private nextClientId = 0; // 클라이언트 ID 생성을 위한 카운터

  constructor(
    private readonly mediasoupService: MediasoupService,
    private readonly roomService: RoomService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 클라이언트 연결 시
  handleConnection(client: AuthenticatedSocket) {
    client.clientId = (this.nextClientId++).toString(); // 고유한 clientId 할당
    this.logger.log(`클라이언트 ID ${client.clientId}로 클라이언트 연결됨`);

    // 원시 메시지 핸들러 (NestJS @SubscribeMessage가 ws 라이브러리와 호환되지 않아 직접 구현)
    client.on('message', async (rawMessage: string) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        this.logger.debug(
          `클라이언트 ${client.clientId}로부터 원시 메시지 수신됨: ${JSON.stringify(message)}`,
        );
        await this.handleRawMessage(client, message);
      } catch (error) {
        this.logger.error(
          `클라이언트 ${client.clientId}로부터의 메시지 파싱 또는 처리 실패: ${error.message}`,
        );
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              event: 'error',
              message: '유효하지 않은 메시지 형식입니다.',
            }),
          );
        }
      }
    });

    // disconnect 대신 close 사용
    client.on('close', () => {
      this.handleDisconnect(client);
    });

    // 오류 처리
    client.on('error', (error) => {
      this.logger.error(
        `클라이언트 ${client.clientId}에 대한 WebSocket 오류: ${error.message}`,
      );
      client.close(); // 오류 발생 시 연결 닫기
    });
  }

  // 클라이언트 연결 해제 시
  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    const channelPk = client.channelPk;
    const clientId = client.clientId; // 이제 clientId를 사용

    if (userId && channelPk && clientId) {
      try {
        await this.roomService.cleanupPeer(channelPk, userId, clientId); // client.id 대신 clientId 사용
        this.logger.log(
          `사용자 ${userId} (클라이언트 ID: ${clientId})가 채널 ${channelPk}에서 연결 해제 및 정리됨`,
        );
      } catch (error) {
        this.logger.error(
          `사용자 ${userId} (클라이언트 ID: ${clientId})를 채널 ${channelPk}에서 정리하는 중 오류 발생: ${error.message}`,
        );
      }
    } else {
      this.logger.log(
        `클라이언트 연결 해제됨, 사용자 ID: ${userId}, 채널 PK: ${channelPk}, 클라이언트 ID: ${clientId}`,
      );
    }
  }

  // 음성/화상 채널 입장 (joinRoom)
  async handleJoinRoom(data: any, client: AuthenticatedSocket) {
    // 1. 페이로드 유효성 검증
    const payloadError = validatePayload(data, [
      'channelPk',
      'accessToken',
      'rtpCapabilities',
    ]);
    if (payloadError) {
      this.logger.error(
        `클라이언트 ${client.clientId}에 대한 JoinRoom 페이로드 유효성 검사 오류: ${payloadError}`,
      );
      client.send(
        JSON.stringify({ event: 'joinRoomError', message: payloadError }),
      );
      return;
    }

    const { channelPk, accessToken, rtpCapabilities } = data;

    this.logger.debug(
      `handleJoinRoom received accessToken: ${accessToken.substring(0, 30)}...`,
    );

    // Retrieve JWT_SECRET using ConfigService (ensures it's loaded)
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      this.logger.error('JWT_SECRET is not configured. Cannot verify token.');
      client.send(
        JSON.stringify({
          event: 'joinRoomError',
          message: '서버 구성 오류: JWT_SECRET이 설정되지 않았습니다.',
        }),
      );
      client.close();
      return;
    }

    // 2. JWT 토큰 검증 및 userId 추출
    const decodedToken = verifyAndDecodeaccessToken(accessToken, jwtSecret);
    if (!decodedToken || !decodedToken.userId) {
      this.logger.error(
        `클라이언트 ${client.clientId}에서 제공한 인증 토큰이 유효하지 않거나 만료되었습니다. Decoded token result: ${JSON.stringify(decodedToken)}`,
      );
      client.send(
        JSON.stringify({
          event: 'joinRoomError',
          message: '인증 토큰이 유효하지 않거나 만료되었습니다.',
        }),
      );
      client.close(); // disconnect 대신 close 사용
      return;
    }
    const userId = Number(decodedToken.userId); // userId를 number로 변환

    // 클라이언트 소켓에 userId와 accessToken 저장
    client.userId = userId;
    client.accessToken = accessToken; // 추후 필요할 경우 재사용 (예: 권한 갱신)

    try {
      // 3. 메인 서버로 채널 유효성 검증 요청
      const mainServerUrl = this.configService.get<string>('MAIN_SERVER_URL');
      if (mainServerUrl === undefined) {
        this.logger.error('MAIN_SERVER_URL이(가) 구성되지 않았습니다.');
        client.send(
          JSON.stringify({
            event: 'joinRoomError',
            message: '서버 구성 오류.',
          }),
        );
        client.close(); // disconnect 대신 close 사용
        return;
      }
      const validationUrl = `${mainServerUrl}/api/ex/sfu-validate/channel/${channelPk}`; // 메인 서버 API 경로 확인 필요
      this.logger.debug(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})를 위해 ${validationUrl}에서 채널 ${channelPk} 유효성 검사 중`,
      );
      const response = await firstValueFrom(
        this.httpService.get<{
          isValid: boolean;
          channelKind?: 'TEXT' | 'VOICE';
        }>(validationUrl as string),
      );

      const { isValid, channelKind } = response.data;

      if (!isValid) {
        this.logger.warn(
          `채널 ${channelPk}을(를) 찾을 수 없거나 사용자 ${userId} (클라이언트 ID: ${client.clientId})에게 유효하지 않습니다.`,
        );
        client.send(
          JSON.stringify({
            event: 'joinRoomError',
            message: '채널을 찾을 수 없거나 유효하지 않습니다.',
          }),
        );
        client.close(); // disconnect 대신 close 사용
        return;
      }

      if (channelKind !== 'VOICE') {
        this.logger.warn(
          `채널 ${channelPk}은 음성채널이 아닙니다 (종류: ${channelKind}).`,
        );
        client.send(
          JSON.stringify({
            event: 'joinRoomError',
            message: '이 채널은 음성 채널이 아닙니다.',
          }),
        );
        client.close(); // disconnect 대신 close 사용
        return;
      }

      // 4. 유효성 검증 성공 시 RoomService를 통해 룸 참여 로직 수행
      // 클라이언트 소켓에 channelPk 저장 (cleanupPeer 등에서 사용)
      client.channelPk = channelPk;

      // RoomService는 이제 'peers' 목록을 관리하고, 새로운 peer가 들어왔을 때 다른 peer들에게 알림을 보냅니다.
      const joinResult = await this.roomService.joinRoom(
        channelPk,
        userId,
        client.clientId!,
        rtpCapabilities,
        client,
      ); // client.id 대신 client.clientId 사용

      this.logger.log(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})가 채널 ${channelPk}에 참여했습니다.`,
      );

      // 5. 클라이언트에게 성공 응답 전송
      client.send(
        JSON.stringify({
          event: 'joinRoomSuccess',
          channelPk: channelPk,
          userId: userId,
          routerRtpCapabilities: joinResult.routerRtpCapabilities,
          existingProducers: joinResult.existingProducers,
          existingPeers: joinResult.existingPeers,
        }),
      );
    } catch (error) {
      this.logger.error(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})가 채널 ${channelPk}에 참여하는 중 오류 발생: ${error.message}`,
        error.stack,
      );
      let errorMessage = '채널에 참여하는 중 예상치 못한 오류가 발생했습니다.';
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = `메인 서버 오류: ${error.response.data.message}`;
      } else if (error.message.includes('Network Error')) {
        errorMessage = '유효성 검사를 위해 메인 서버에 연결할 수 없습니다.';
      }
      client.send(
        JSON.stringify({ event: 'joinRoomError', message: errorMessage }),
      );
      client.close(); // disconnect 대신 close 사용
    }
  }

  // ========== mediasoup SFU 시그널링 핸들러들 ==========

  // Router RTP Capabilities 요청
  async handleGetRouterRtpCapabilities(data: any, client: AuthenticatedSocket) {
    if (!data || !data.channelPk) {
      this.logger.error(
        `클라이언트 ${client.clientId}에 대한 get-router-rtp-capabilities의 데이터가 유효하지 않습니다.`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          message: '유효하지 않은 데이터: channelPk 누락',
        }),
      );
      return;
    }

    const { channelPk } = data;
    const userId = client.userId;

    // userId 검증 추가 (모든 핸들러에서 필요)
    if (!userId) {
      this.logger.error(
        `get-router-rtp-capabilities에 대한 사용자 인증이 되지 않았습니다 (클라이언트 ID: ${client.clientId})`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      const rtpCapabilities =
        await this.mediasoupService.getRouterRtpCapabilities(channelPk);

      this.logger.log(
        `채널 ${channelPk}에 대한 라우터 RTP 기능이 사용자 ${userId} (클라이언트 ID: ${client.clientId})에게 전송되었습니다.`,
      );

      client.send(
        JSON.stringify({
          event: 'router-rtp-capabilities',
          rtpCapabilities,
        }),
      );
    } catch (error) {
      this.logger.error(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})의 라우터 RTP 기능을 가져오는 데 실패: ${error.message}`,
      );
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // WebRTC Transport 생성
  async handleCreateWebRtcTransport(data: any, client: AuthenticatedSocket) {
    if (!data || !data.channelPk) {
      this.logger.error(
        `클라이언트 ${client.clientId}에 대한 create-webrtc-transport의 데이터가 유효하지 않습니다.`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(
        `create-webrtc-transport에 대한 사용자 인증이 되지 않았습니다 (클라이언트 ID: ${client.clientId})`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      const transportInfo = await this.roomService.createWebRtcTransport(
        channelPk,
        userId,
      );

      this.logger.log(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})를 위해 채널 ${channelPk}에 전송 ${transportInfo.id} 생성됨`,
      );

      client.send(
        JSON.stringify({
          event: 'webrtc-transport-created',
          ...transportInfo,
        }),
      );
    } catch (error) {
      this.logger.error(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})를 위한 전송 생성 실패: ${error.message}`,
      );
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // Transport 연결
  async handleConnectTransport(data: any, client: AuthenticatedSocket) {
    if (!data || !data.channelPk || !data.transportId || !data.dtlsParameters) {
      this.logger.error(
        `클라이언트 ${client.clientId}에 대한 connect-transport의 데이터가 유효하지 않습니다.`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk, transportId, dtlsParameters } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(
        `connect-transport에 대한 사용자 인증이 되지 않았습니다 (클라이언트 ID: ${client.clientId})`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      await this.roomService.connectTransport(
        channelPk,
        userId,
        transportId,
        dtlsParameters,
      );

      this.logger.log(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})를 위한 전송 ${transportId} 연결됨`,
      );

      client.send(
        JSON.stringify({ event: 'transport-connected', transportId }),
      );
    } catch (error) {
      this.logger.error(
        `사용자 ${userId} (클라이언트 ID: ${client.clientId})를 위한 전송 연결 실패: ${error.message}`,
      );
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // Producer 생성 (미디어 전송 시작)
  async handleProduce(data: any, client: AuthenticatedSocket) {
    if (
      !data ||
      !data.channelPk ||
      !data.transportId ||
      !data.kind ||
      !data.rtpParameters
    ) {
      this.logger.error(
        `클라이언트 ${client.clientId}에 대한 produce의 데이터가 유효하지 않습니다.`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk, transportId, kind, rtpParameters } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(`사용자 인증 실패 (클라이언트 ID: ${client.clientId})`);
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      const { id: producerId } = await this.roomService.createProducer(
        channelPk,
        userId,
        transportId,
        kind,
        rtpParameters,
      );

      this.logger.log(
        `Producer ${producerId} 생성됨: 사용자 ${userId} (clientId: ${client.clientId})`,
      );

      client.send(JSON.stringify({ event: 'produced', producerId }));
    } catch (error) {
      this.logger.error(`Producer 생성 실패: ${error.message}`);
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // Consumer 생성 (다른 사용자의 미디어 수신)
  async handleConsume(data: any, client: AuthenticatedSocket) {
    if (
      !data ||
      !data.channelPk ||
      !data.transportId ||
      !data.producerId ||
      !data.rtpCapabilities
    ) {
      this.logger.error(
        `Invalid data for consume for client ${client.clientId}`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk, transportId, producerId, rtpCapabilities } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(
        `User not authenticated for consume (clientId: ${client.clientId})`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
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
        client.send(
          JSON.stringify({
            event: 'error',
            message: '이 producer를 소비할 수 없습니다.',
          }),
        );
        return;
      }

      this.logger.log(
        `Consumer 생성됨: 사용자 ${userId} (clientId: ${client.clientId})`,
      );

      client.send(
        JSON.stringify({
          event: 'consumed',
          ...consumerInfo,
        }),
      );
    } catch (error) {
      this.logger.error(`Consumer 생성 실패: ${error.message}`);
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // Consumer Resume (미디어 수신 재개)
  async handleResumeConsumer(data: any, client: AuthenticatedSocket) {
    if (!data || !data.channelPk || !data.consumerId) {
      this.logger.error(
        `유효하지 않은 resume-consumer 데이터: ${client.clientId}`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk, consumerId } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(`인가되지 않은 사용자 (clientId: ${client.clientId})`);
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      await this.roomService.resumeConsumer(channelPk, userId, consumerId);

      this.logger.log(
        `Consumer가 재개됨: 사용자 ${userId} (clientId: ${client.clientId})`,
      );

      client.send(JSON.stringify({ event: 'consumer-resumed', consumerId }));
    } catch (error) {
      this.logger.error(`Consumer 재개 실패: ${error.message}`);
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // Producer 닫기
  async handleCloseProducer(data: any, client: AuthenticatedSocket) {
    if (!data || !data.channelPk || !data.producerId) {
      this.logger.error(
        `유효하지 않은 close-producer 데이터: ${client.clientId}`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk, producerId } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(
        `producer 닫기 실패 - 인가되지 않은 사용자: (clientId: ${client.clientId})`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      await this.roomService.closeProducer(channelPk, userId, producerId);

      this.logger.log(
        `유저 ${userId} (clientId: ${client.clientId})의 Producer ${producerId} 닫힘`,
      );

      client.send(JSON.stringify({ event: 'producer-closed', producerId }));
    } catch (error) {
      this.logger.error(
        `유저 ${userId} (clientId: ${client.clientId})의 Producer ${producerId} 닫기 실패: ${error.message}`,
      );
      client.send(JSON.stringify({ event: 'error', message: error.message }));
    }
  }

  // 기존 Producer 목록 요청
  async handleGetProducers(data: any, client: AuthenticatedSocket) {
    if (!data || !data.channelPk) {
      this.logger.error(
        `유효하지 않은 get-producers 데이터: ${client.clientId}`,
      );
      client.send(
        JSON.stringify({ event: 'error', message: '유효하지 않은 데이터' }),
      );
      return;
    }

    const { channelPk } = data;
    const userId = client.userId;

    if (!userId) {
      this.logger.error(`인가되지 않은 사용자 (clientId: ${client.clientId})`);
      client.send(
        JSON.stringify({
          event: 'error',
          message: '사용자 인증이 되지 않았습니다.',
        }),
      );
      return;
    }

    try {
      const producers = this.roomService.getProducersInRoom(channelPk, userId);

      this.logger.log(
        `채널${channelPk}에서 유저 ${userId} (clientId: ${client.clientId})의 Producer 목록 요청`,
      );

      client.send(
        JSON.stringify({
          event: 'producers-list',
          producers,
        }),
      );
    } catch (error) {
      this.logger.error(`Producer 목록 요청 실패: ${error.message}`);
      client.send(JSON.stringify({ event: 'error', message: error.message }));
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
      // 모든 핸들러는 이제 직접 client.send()를 호출하므로 response 변수는 제거합니다.
      switch (event) {
        case 'join-room':
          await this.handleJoinRoom(data, client);
          return;
        // case 'leave-channel': // handleLeaveChannel 제거로 인해 주석 처리. roomService에서 처리될 예정
        //   // response = await this.handleLeaveChannel(data, client);
        //   // break;
        case 'get-router-rtp-capabilities':
          await this.handleGetRouterRtpCapabilities(data, client);
          return;
        case 'create-webrtc-transport':
          await this.handleCreateWebRtcTransport(data, client);
          return;
        case 'connect-transport':
          await this.handleConnectTransport(data, client);
          return;
        case 'produce':
          await this.handleProduce(data, client);
          return;
        case 'consume':
          await this.handleConsume(data, client);
          return;
        case 'resume-consumer':
          await this.handleResumeConsumer(data, client);
          return;
        case 'close-producer':
          await this.handleCloseProducer(data, client);
          return;
        case 'get-producers':
          await this.handleGetProducers(data, client);
          return;
        default:
          this.logger.warn(`알 수 없는 이벤트: ${event}`);
          client.send(
            JSON.stringify({
              event: 'error',
              message: `Unknown event: ${event}`,
            }),
          );
          return;
      }
    } catch (error) {
      this.logger.error(`Raw 메시지 처리 실패: ${error.message}`, error.stack);
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: 'error', message: error.message }));
      }
    }
  }
}
