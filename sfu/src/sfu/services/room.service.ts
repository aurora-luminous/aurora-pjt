import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { types } from 'mediasoup';

type WebRtcTransport = types.WebRtcTransport;
type Producer = types.Producer;
type Consumer = types.Consumer;
type RtpCapabilities = types.RtpCapabilities;
type DtlsParameters = types.DtlsParameters;
type RtpParameters = types.RtpParameters;

/**
 * 사용자별 Transport 및 Producer/Consumer 정보
 */
interface Peer {
  userId: number;
  transports: Map<string, WebRtcTransport>; // transportId -> Transport
  producers: Map<string, Producer>; // producerId -> Producer
  consumers: Map<string, Consumer>; // consumerId -> Consumer
}

/**
 * Room (채널) 정보
 */
interface Room {
  channelPk: number;
  peers: Map<number, Peer>; // userId -> Peer
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  // 채널별 Room 관리
  private rooms: Map<number, Room> = new Map();

  constructor(private readonly mediasoupService: MediasoupService) {}

  /**
   * Room 가져오기 또는 생성
   */
  private getOrCreateRoom(channelPk: number): Room {
    if (!this.rooms.has(channelPk)) {
      this.rooms.set(channelPk, {
        channelPk,
        peers: new Map(),
      });
      this.logger.log(`Room created for channel ${channelPk}`);
    }
    return this.rooms.get(channelPk)!;
  }

  /**
   * Peer 가져오기 또는 생성
   */
  private getOrCreatePeer(channelPk: number, userId: number): Peer {
    const room = this.getOrCreateRoom(channelPk);

    if (!room.peers.has(userId)) {
      room.peers.set(userId, {
        userId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      });
      this.logger.log(`Peer created: user ${userId} in channel ${channelPk}`);
    }

    return room.peers.get(userId)!;
  }

  /**
   * WebRTC Transport 생성
   */
  async createWebRtcTransport(
    channelPk: number,
    userId: number,
  ): Promise<{
    id: string;
    iceParameters: any;
    iceCandidates: any;
    dtlsParameters: any;
  }> {
    const router = await this.mediasoupService.getOrCreateRouter(channelPk);
    const peer = this.getOrCreatePeer(channelPk, userId);

    const transportOptions = this.mediasoupService.getWebRtcTransportOptions();

    const transport = await router.createWebRtcTransport({
      listenIps: transportOptions.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: transportOptions.initialAvailableOutgoingBitrate,
    });

    // Transport 저장
    peer.transports.set(transport.id, transport);

    this.logger.log(`Transport created: ${transport.id} for user ${userId} in channel ${channelPk}`);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  /**
   * Transport 연결
   */
  async connectTransport(
    channelPk: number,
    userId: number,
    transportId: string,
    dtlsParameters: DtlsParameters,
  ): Promise<void> {
    const peer = this.getOrCreatePeer(channelPk, userId);
    const transport = peer.transports.get(transportId);

    if (!transport) {
      throw new NotFoundException(`Transport ${transportId} not found`);
    }

    await transport.connect({ dtlsParameters });
    this.logger.log(`Transport connected: ${transportId} for user ${userId}`);
  }

  /**
   * Producer 생성 (미디어 전송)
   */
  async createProducer(
    channelPk: number,
    userId: number,
    transportId: string,
    kind: 'audio' | 'video',
    rtpParameters: RtpParameters,
  ): Promise<{ id: string }> {
    const peer = this.getOrCreatePeer(channelPk, userId);
    const transport = peer.transports.get(transportId);

    if (!transport) {
      throw new NotFoundException(`Transport ${transportId} not found`);
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    peer.producers.set(producer.id, producer);

    this.logger.log(`Producer created: ${producer.id} (${kind}) for user ${userId} in channel ${channelPk}`);

    // 같은 채널의 다른 사용자들에게 새 Producer 알림 (Gateway에서 처리)
    return { id: producer.id };
  }

  /**
   * Consumer 생성 (미디어 수신)
   */
  async createConsumer(
    channelPk: number,
    userId: number,
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<{
    id: string;
    producerId: string;
    kind: string;
    rtpParameters: RtpParameters;
  } | null> {
    const router = this.mediasoupService.getRouter(channelPk);

    if (!router) {
      throw new NotFoundException(`Router for channel ${channelPk} not found`);
    }

    const peer = this.getOrCreatePeer(channelPk, userId);
    const transport = peer.transports.get(transportId);

    if (!transport) {
      throw new NotFoundException(`Transport ${transportId} not found`);
    }

    // Router가 해당 RTP Capabilities로 consume 가능한지 확인
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      this.logger.warn(`Cannot consume producer ${producerId} with given RTP capabilities`);
      return null;
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true, // 처음에는 일시정지 상태로 생성
    });

    peer.consumers.set(consumer.id, consumer);

    this.logger.log(`Consumer created: ${consumer.id} for user ${userId} in channel ${channelPk}`);

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  /**
   * Consumer Resume (미디어 수신 재개)
   */
  async resumeConsumer(channelPk: number, userId: number, consumerId: string): Promise<void> {
    const peer = this.getOrCreatePeer(channelPk, userId);
    const consumer = peer.consumers.get(consumerId);

    if (!consumer) {
      throw new NotFoundException(`Consumer ${consumerId} not found`);
    }

    await consumer.resume();
    this.logger.log(`Consumer resumed: ${consumerId} for user ${userId}`);
  }

  /**
   * Consumer Pause (미디어 수신 일시정지)
   */
  async pauseConsumer(channelPk: number, userId: number, consumerId: string): Promise<void> {
    const peer = this.getOrCreatePeer(channelPk, userId);
    const consumer = peer.consumers.get(consumerId);

    if (!consumer) {
      throw new NotFoundException(`Consumer ${consumerId} not found`);
    }

    await consumer.pause();
    this.logger.log(`Consumer paused: ${consumerId} for user ${userId}`);
  }

  /**
   * Producer 닫기
   */
  async closeProducer(channelPk: number, userId: number, producerId: string): Promise<void> {
    const room = this.rooms.get(channelPk);
    if (!room) return;

    const peer = room.peers.get(userId);
    if (!peer) return;

    const producer = peer.producers.get(producerId);
    if (producer) {
      producer.close();
      peer.producers.delete(producerId);
      this.logger.log(`Producer closed: ${producerId} for user ${userId}`);
    }
  }

  /**
   * Consumer 닫기
   */
  async closeConsumer(channelPk: number, userId: number, consumerId: string): Promise<void> {
    const room = this.rooms.get(channelPk);
    if (!room) return;

    const peer = room.peers.get(userId);
    if (!peer) return;

    const consumer = peer.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      peer.consumers.delete(consumerId);
      this.logger.log(`Consumer closed: ${consumerId} for user ${userId}`);
    }
  }

  /**
   * 사용자의 모든 리소스 정리
   */
  async cleanupPeer(channelPk: number, userId: number): Promise<void> {
    const room = this.rooms.get(channelPk);
    if (!room) return;

    const peer = room.peers.get(userId);
    if (!peer) return;

    // 모든 Consumer 닫기
    peer.consumers.forEach((consumer) => consumer.close());
    peer.consumers.clear();

    // 모든 Producer 닫기
    peer.producers.forEach((producer) => producer.close());
    peer.producers.clear();

    // 모든 Transport 닫기
    peer.transports.forEach((transport) => transport.close());
    peer.transports.clear();

    room.peers.delete(userId);
    this.logger.log(`Peer cleaned up: user ${userId} in channel ${channelPk}`);

    // Room이 비었으면 삭제
    if (room.peers.size === 0) {
      this.rooms.delete(channelPk);
      await this.mediasoupService.closeRouter(channelPk);
      this.logger.log(`Room closed: channel ${channelPk}`);
    }
  }

  /**
   * 채널의 모든 Producer 가져오기 (특정 사용자 제외)
   */
  getProducersInRoom(channelPk: number, excludeUserId?: number): Array<{
    userId: number;
    producerId: string;
    kind: string;
  }> {
    const room = this.rooms.get(channelPk);
    if (!room) return [];

    const producers: Array<{ userId: number; producerId: string; kind: string }> = [];

    room.peers.forEach((peer, userId) => {
      if (excludeUserId && userId === excludeUserId) return;

      peer.producers.forEach((producer, producerId) => {
        producers.push({
          userId,
          producerId,
          kind: producer.kind,
        });
      });
    });

    return producers;
  }

  /**
   * 통계 정보
   */
  getStats() {
    const stats: any[] = [];

    this.rooms.forEach((room, channelPk) => {
      const roomStats = {
        channelPk,
        peersCount: room.peers.size,
        peers: [] as any[],
      };

      room.peers.forEach((peer, userId) => {
        roomStats.peers.push({
          userId,
          transportsCount: peer.transports.size,
          producersCount: peer.producers.size,
          consumersCount: peer.consumers.size,
        });
      });

      stats.push(roomStats);
    });

    return stats;
  }
}
