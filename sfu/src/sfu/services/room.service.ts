import { Injectable, Logger } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import {
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
} from 'mediasoup/types';
import { ConfigService } from '@nestjs/config';
import { WebSocket } from 'ws';
import { MediasoupService } from './mediasoup.service';

// SfuGateway에서 정의한 AuthenticatedSocket 인터페이스와 일치하도록 정의
interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  channelPk?: number;
  accessToken?: string;
  clientId?: string;
}

// ======================================================================================
// Peer 관련 인터페이스
// ======================================================================================
interface Peer {
  userId: number;
  clientId: string; // 클라이언트 소켓의 고유 ID
  rtpCapabilities?: any; // 클라이언트의 RTP Capabilities
  transports: Map<string, WebRtcTransport>; // key: transportId, value: WebRtcTransport
  producers: Map<string, Producer>; // key: producerId, value: Producer
  consumers: Map<string, Consumer>; // key: consumerId, value: Consumer
  socket: AuthenticatedSocket; // 해당 피어의 WebSocket 연결
}

// ======================================================================================
// MediaRoom 관련 인터페이스
// ======================================================================================
interface MediaRoom {
  channelPk: number;
  router: Router;
  peers: Map<number, Peer>; // key: userId, value: Peer
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private rooms: Map<number, MediaRoom> = new Map(); // key: channelPk, value: MediaRoom

  constructor(
    private readonly configService: ConfigService,
    private readonly mediasoupService: MediasoupService,
  ) {}

  // ======================================================================================
  // 룸(Router) 관리
  // ======================================================================================
  private async findOrCreateRoom(channelPk: number): Promise<MediaRoom> {
    if (this.rooms.has(channelPk)) {
      return this.rooms.get(channelPk)!;
    }

    // MediasoupService를 통해 공통 Router 가져오기
    const router = await this.mediasoupService.getOrCreateRouter(channelPk);

    const newRoom: MediaRoom = {
      channelPk,
      router,
      peers: new Map(),
    };
    this.rooms.set(channelPk, newRoom);
    this.logger.log(`채널 ${channelPk}의 MediaRoom(Router 연동)이 준비됨`);
    return newRoom;
  }

  // ======================================================================================
  // 피어(Peer) 관리 및 룸 참여
  // ======================================================================================
  async joinRoom(
    channelPk: number,
    userId: number,
    clientId: string,
    rtpCapabilities: any,
    clientSocket: AuthenticatedSocket, // AuthenticatedSocket 타입으로 변경
  ): Promise<{
    routerRtpCapabilities: any;
    existingProducers: any[];
    existingPeers: { userId: number; clientId: string }[];
  }> {
    const room = await this.findOrCreateRoom(channelPk);

    // 이미 존재하는 피어인지 확인 (같은 userId여도 다른 clientId일 수 있음 = 다른 디바이스 접속)
    let peer = room.peers.get(userId);

    // Peer가 없거나 (다른 디바이스) clientId가 다른 경우 새 Peer 생성
    // 동일한 userId지만 다른 clientId (다른 디바이스에서 접속)인 경우도 처리
    if (!peer || peer.clientId !== clientId) {
      peer = {
        userId,
        clientId,
        rtpCapabilities,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        socket: clientSocket, // 클라이언트 소켓 저장
      };
      room.peers.set(userId, peer);
      this.logger.log(
        `Peer ${userId} (clientId: ${clientId})가 방 ${channelPk}에 입장`,
      );

      // 다른 Peer들에게 새 Peer가 참여했음을 알림
      this.notifyOtherPeers(room, userId, {
        event: 'new-peer',
        userId,
        clientId,
      });
    } else {
      // 이미 존재하는 Peer라면 rtpCapabilities 업데이트
      peer.rtpCapabilities = rtpCapabilities;
      peer.socket = clientSocket; // 소켓 업데이트 (재연결 등 고려)
      this.logger.log(
        `Peer ${userId} (clientId: ${clientId}) 가 방 ${channelPk}에 재입장`,
      );
    }

    const existingProducers: any[] = [];
    room.peers.forEach((p) => {
      p.producers.forEach((producer) => {
        // 본인(userId)이 아닌 다른 피어의 producers만 추가
        if (p.userId !== userId) {
          existingProducers.push({
            producerId: producer.id,
            userId: p.userId,
            kind: producer.kind,
            paused: producer.paused,
          });
        }
      });
    });

    const existingPeers = Array.from(room.peers.values())
      .filter((p) => p.userId !== userId) // 본인 제외
      .map((p) => ({ userId: p.userId, clientId: p.clientId }));

    return {
      routerRtpCapabilities: room.router.rtpCapabilities,
      existingProducers,
      existingPeers,
    };
  }

  // ======================================================================================
  // 피어 연결 해제 및 리소스 정리
  // ======================================================================================
  async cleanupPeer(
    channelPk: number,
    userId: number,
    clientId: string,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    if (!room) {
      this.logger.warn(
        `방 ${channelPk} 을 찾을 수 없어 피어를 정리할 수 없습니다. (userId: ${userId}, clientId: ${clientId})`,
      );
      return;
    }

    const peer = room.peers.get(userId);
    // Peer가 존재하고, 현재 클라이언트(clientId)와 일치하는 경우에만 정리
    if (peer && peer.clientId === clientId) {
      this.logger.log(
        `방 ${channelPk}의 유저 ${userId} (clientId: ${clientId}) 피어 정리됨`,
      );

      // 모든 Transport, Producer, Consumer 닫기
      peer.transports.forEach((transport) => transport.close());
      peer.producers.forEach((producer) => producer.close());
      peer.consumers.forEach((consumer) => consumer.close());

      // 룸에서 Peer 제거
      room.peers.delete(userId);

      // 다른 Peer들에게 Peer가 떠났음을 알림
      this.notifyOtherPeers(room, userId, {
        event: 'peer-left',
        userId,
        clientId,
      });

      // 룸에 더 이상 Peer가 없으면 Router도 닫기
      if (room.peers.size === 0) {
        this.logger.log(`빈 방 ${channelPk}의 라우터 닫음`);
        room.router.close();
        this.rooms.delete(channelPk);
      }
    } else if (peer && peer.clientId !== clientId) {
      this.logger.warn(
        `클라이언트 ID ${clientId}가 룸 ${channelPk}의 활성 클라이언트 ID ${peer.clientId}와 일치하지 않습니다.`,
      );
    } else {
      this.logger.warn(
        `피어 ${userId}를 룸 ${channelPk}에서 찾을 수 없습니다.`,
      );
    }
  }

  // ======================================================================================
  // WebRTC Transport 생성
  // ======================================================================================
  async createWebRtcTransport(
    channelPk: number,
    userId: number,
  ): Promise<{
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  }> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(
        `룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다.`,
      );
    }

    const transport = await room.router.createWebRtcTransport(
      this.mediasoupService.getWebRtcTransportOptions()
    );

    peer.transports.set(transport.id, transport);
    this.logger.log(
      `${userId}: 룸 ${channelPk}에 WebRtcTransport ${transport.id} 생성됨`,
    );

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  // ======================================================================================
  // Transport 연결
  // ======================================================================================
  async connectTransport(
    channelPk: number,
    userId: number,
    transportId: string,
    dtlsParameters: any,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(
        `룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다.`,
      );
    }

    const transport = peer.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId}를 찾을 수 없습니다.`);
    }

    await transport.connect({ dtlsParameters });
    this.logger.log(
      `${userId}의 Transport ${transportId}가 룸 ${channelPk}에 연결되었습니다.`,
    );
  }

  // ======================================================================================
  // Producer 생성
  // ======================================================================================
  async createProducer(
    channelPk: number,
    userId: number,
    transportId: string,
    kind: 'audio' | 'video',
    rtpParameters: any,
    appData: any = {},
  ): Promise<{ id: string }> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(
        `룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다.`,
      );
    }

    const transport = peer.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId}를 찾을 수 없습니다.`);
    }

    const producer = await transport.produce({ kind, rtpParameters, appData });
    peer.producers.set(producer.id, producer);
    this.logger.log(
      `피어 ${userId}를 위해 룸 ${channelPk}에 Producer ${producer.id} (${kind}) 생성됨`,
    );

    // 새 Producer가 생성되었음을 다른 Peer들에게 알림
    this.notifyOtherPeers(room, userId, {
      event: 'new-producer',
      producerId: producer.id,
      userId: userId,
      kind: producer.kind,
      paused: producer.paused,
    });

    return { id: producer.id };
  }

  // ======================================================================================
  // Consumer 생성 (다른 Peer의 Producer 구독)
  // ======================================================================================
  async createConsumer(
    channelPk: number,
    userId: number,
    transportId: string,
    producerId: string,
    rtpCapabilities: any,
  ): Promise<{
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
    paused: boolean;
  } | null> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(
        `룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다.`,
      );
    }

    const consumingTransport = peer.transports.get(transportId);
    if (!consumingTransport) {
      throw new Error(`소비중인 Transport ${transportId} 를 찾을 수 없습니다.`);
    }

    // 라우터가 해당 Producer를 소비할 수 있는지 확인
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      this.logger.warn(
        `라우터가 해당 producer ${producerId} 를 소비할 수 없습니다.`,
      );
      return null; // 소비 불가능
    }

    const producerPeer = Array.from(room.peers.values()).find((p) =>
      p.producers.has(producerId),
    );
    if (producerPeer && producerPeer.userId === userId) {
      this.logger.warn(
        `피어 ${userId}가 자신의 Producer ${producerId} 를 소비할 수 없습니다.`,
      );
      return null; // 자신의 Producer는 소비하지 않음
    }

    const consumer = await consumingTransport.consume({
      producerId,
      rtpCapabilities,
      paused: producerPeer?.producers.get(producerId)?.paused || false, // Producer의 현재 상태를 따름
    });

    peer.consumers.set(consumer.id, consumer);
    this.logger.log(
      `룸 ${channelPk}에서 Producer ${producerId}를 소비하는 Consumer ${consumer.id} 생성됨`,
    );

    // Consumer 이벤트 처리
    consumer.on('transportclose', () => {
      this.logger.warn(`Consumer ${consumer.id} 트랜스포트 닫힘`);
      consumer.close();
      peer.consumers.delete(consumer.id);
    });
    consumer.on('producerclose', () => {
      this.logger.warn(`Consumer ${consumer.id} Producer 닫힘`);
      consumer.close();
      peer.consumers.delete(consumer.id);
      // 클라이언트에게 해당 producer가 닫혔음을 알릴 수 있음
      peer.socket.send(
        JSON.stringify({
          event: 'producer-closed',
          producerId: producerId,
        }),
      );
    });

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      paused: consumer.paused,
    };
  }

  // ======================================================================================
  // Consumer 재개
  // ======================================================================================
  async resumeConsumer(
    channelPk: number,
    userId: number,
    consumerId: string,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(`룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다`);
    }

    const consumer = peer.consumers.get(consumerId);
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} 를 찾을 수 없습니다.`);
    }

    await consumer.resume();
    this.logger.log(`룸 ${channelPk}의 Consumer ${consumerId} 재개됨`);
  }

  // ======================================================================================
  // Consumer 일시정지
  // ======================================================================================
  async pauseConsumer(
    channelPk: number,
    userId: number,
    consumerId: string,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(`룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다`);
    }

    const consumer = peer.consumers.get(consumerId);
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} 를 찾을 수 없습니다.`);
    }

    await consumer.pause();
    this.logger.log(`룸 ${channelPk}의 Consumer ${consumerId} 일시정지됨`);
  }

  // ======================================================================================
  // Producer 일시정지
  // ======================================================================================
  async pauseProducer(
    channelPk: number,
    userId: number,
    producerId: string,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(`룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다`);
    }

    const producer = peer.producers.get(producerId);
    if (!producer) {
      throw new Error(`Producer ${producerId} 를 찾을 수 없습니다.`);
    }

    await producer.pause();
    this.logger.log(`룸 ${channelPk}의 Producer ${producerId} 일시정지됨`);
  }

  // ======================================================================================
  // Producer 재개
  // ======================================================================================
  async resumeProducer(
    channelPk: number,
    userId: number,
    producerId: string,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(`룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다`);
    }

    const producer = peer.producers.get(producerId);
    if (!producer) {
      throw new Error(`Producer ${producerId} 를 찾을 수 없습니다.`);
    }

    await producer.resume();
    this.logger.log(`룸 ${channelPk}의 Producer ${producerId} 재개됨`);
  }

  // ======================================================================================
  // Producer 닫기
  // ======================================================================================
  async closeProducer(
    channelPk: number,
    userId: number,
    producerId: string,
  ): Promise<void> {
    const room = this.rooms.get(channelPk);
    const peer = room?.peers.get(userId);

    if (!room || !peer) {
      throw new Error(
        `룸 ${channelPk} 또는 피어 ${userId}를 찾을 수 없습니다.`,
      );
    }

    const producer = peer.producers.get(producerId);
    if (!producer) {
      throw new Error(`Producer ${producerId} 를 찾을 수 없습니다.`);
    }

    producer.close();
    peer.producers.delete(producerId);
    this.logger.log(`룸 ${channelPk}의 Producer ${producerId}가 닫혔습니다.`);

    // 다른 Peer들에게 해당 Producer가 닫혔음을 알림
    this.notifyOtherPeers(room, userId, {
      event: 'producer-closed',
      producerId,
      userId,
    });
  }

  // ======================================================================================
  // 룸 내 Producer 목록 가져오기
  // ======================================================================================
  getProducersInRoom(
    channelPk: number,
    requestingUserId: number,
  ): {
    id: string;
    userId: number;
    kind: 'audio' | 'video';
    paused: boolean;
  }[] {
    const room = this.rooms.get(channelPk);
    if (!room) {
      return [];
    }

    const producers: {
      id: string;
      userId: number;
      kind: 'audio' | 'video';
      paused: boolean;
    }[] = [];
    room.peers.forEach((peer) => {
      // 요청하는 본인의 Producer는 제외 (자신은 자신을 소비할 필요 없음)
      if (peer.userId !== requestingUserId) {
        peer.producers.forEach((producer) => {
          producers.push({
            id: producer.id,
            userId: peer.userId,
            kind: producer.kind,
            paused: producer.paused,
          });
        });
      }
    });
    return producers;
  }

  // ======================================================================================
  // Router RTP Capabilities 가져오기
  // ======================================================================================
  getRouterRtpCapabilities(channelPk: number): any {
    const room = this.rooms.get(channelPk);
    if (!room) {
      throw new Error(`룸 ${channelPk}을(를) 찾을 수 없습니다.`);
    }
    return room.router.rtpCapabilities;
  }

  /**
   * 통계 정보 가져오기
   */
  getStats() {
    const roomStats: any[] = [];
    for (const room of this.rooms.values()) {
      const peerStats: any[] = [];
      for (const peer of room.peers.values()) {
        peerStats.push({
          userId: peer.userId,
          clientId: peer.clientId,
          transportsCount: peer.transports.size,
          producersCount: peer.producers.size,
          consumersCount: peer.consumers.size,
        });
      }
      roomStats.push({
        channelPk: room.channelPk,
        routerId: room.router.id,
        peersCount: room.peers.size,
        peers: peerStats,
      });
    }
    return roomStats;
  }

  // ======================================================================================
  // 다른 Peer들에게 메시지 전송 (브로드캐스트)
  // ======================================================================================
  private notifyOtherPeers(
    room: MediaRoom,
    senderUserId: number,
    message: any,
  ): void {
    room.peers.forEach((peer) => {
      if (
        peer.userId !== senderUserId &&
        peer.socket.readyState === WebSocket.OPEN
      ) {
        peer.socket.send(JSON.stringify(message));
      }
    });
  }
}
