import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { types } from 'mediasoup';

type Worker = types.Worker;
type Router = types.Router;

@Injectable()
export class MediasoupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediasoupService.name);

  // mediasoup Workers (CPU 코어별로 여러 개 생성 가능)
  private workers: Worker[] = [];
  private nextWorkerIdx = 0;

  // 채널별 Router 관리
  private routers: Map<number, Router> = new Map();

  // mediasoup 설정
  private readonly config = {
    // Worker 설정
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn' as const,
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
      ] as mediasoup.types.WorkerLogTag[],
    },
    // Router 설정 (미디어 코덱)
    router: {
      mediaCodecs: [
        {
          kind: 'audio' as const,
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video' as const,
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video' as const,
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
          },
        },
      ] as mediasoup.types.RtpCodecCapability[],
    },
    // WebRtcTransport 설정
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '127.0.0.1', // 실제 배포시에는 공인 IP로 변경 필요
        },
      ],
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000,
    },
  };

  async onModuleInit() {
    await this.createWorkers();
    this.logger.log('Mediasoup 서비스 이니셜라이징');
  }

  async onModuleDestroy() {
    // 모든 Worker 종료
    for (const worker of this.workers) {
      worker.close();
    }
    this.workers = [];
    this.routers.clear();
    this.logger.log('Mediasoup 서비스 제거');
  }

  /**
   * Worker 생성 (CPU 코어 수만큼 생성 가능, 일단 1개만)
   */
  private async createWorkers() {
    const numWorkers = 1; // 시범용으로 1개만 생성

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: this.config.worker.logLevel,
        logTags: this.config.worker.logTags,
        rtcMinPort: this.config.worker.rtcMinPort,
        rtcMaxPort: this.config.worker.rtcMaxPort,
      });

      worker.on('died', () => {
        this.logger.error(`mediasoup Worker가 죽었습니다, 2초 뒤 퇴장합니다... [pid:${worker.pid}]`);
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
      this.logger.log(`Worker 가 생성되었습니다. [pid:${worker.pid}]`);
    }
  }

  /**
   * 다음 사용 가능한 Worker 가져오기 (Round-robin)
   */
  private getNextWorker(): Worker {
    const worker = this.workers[this.nextWorkerIdx];
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  /**
   * 채널용 Router 생성 또는 가져오기
   */
  async getOrCreateRouter(channelPk: number): Promise<Router> {
    // 이미 Router가 있으면 반환
    if (this.routers.has(channelPk)) {
      return this.routers.get(channelPk)!;
    }

    // 새 Router 생성
    const worker = this.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: this.config.router.mediaCodecs,
    });

    this.routers.set(channelPk, router);
    this.logger.log(`채널 라우터 생성됨: ${channelPk}`);

    return router;
  }

  /**
   * Router의 RTP Capabilities 가져오기
   */
  async getRouterRtpCapabilities(channelPk: number): Promise<mediasoup.types.RtpCapabilities> {
    const router = await this.getOrCreateRouter(channelPk);
    return router.rtpCapabilities;
  }

  /**
   * WebRtcTransport 생성 설정 가져오기
   */
  getWebRtcTransportOptions() {
    return this.config.webRtcTransport;
  }

  /**
   * 채널의 Router 제거 (채널이 비어있을 때)
   */
  async closeRouter(channelPk: number) {
    const router = this.routers.get(channelPk);
    if (router) {
      router.close();
      this.routers.delete(channelPk);
      this.logger.log(`채널 라우터 닫힘: ${channelPk}`);
    }
  }

  /**
   * 특정 채널의 Router 가져오기
   */
  getRouter(channelPk: number): Router | undefined {
    return this.routers.get(channelPk);
  }

  /**
   * 통계 정보 가져오기
   */
  getStats() {
    return {
      workersCount: this.workers.length,
      routersCount: this.routers.size,
      workers: this.workers.map(w => ({
        pid: w.pid,
        died: w.closed,
      })),
    };
  }
}
