import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MediasoupService } from '../services/mediasoup.service';
import { RoomService } from '../services/room.service';

@ApiTags('sfu')
@Controller('sfu')
export class SfuController {
  constructor(
    private readonly mediasoupService: MediasoupService,
    private readonly roomService: RoomService,
  ) {}

  /**
   * mediasoup 서버 통계 정보
   */
  @Get('stats')
  @ApiOperation({ summary: 'mediasoup 서버 통계 조회' })
  getStats() {
    const mediasoupStats = this.mediasoupService.getStats();
    const roomStats = this.roomService.getStats();

    return {
      timestamp: new Date().toISOString(),
      mediasoup: mediasoupStats,
      rooms: roomStats,
      summary: {
        totalWorkers: mediasoupStats.workersCount,
        totalRouters: mediasoupStats.routersCount,
        totalRooms: roomStats.length,
        totalPeers: roomStats.reduce((sum, room) => sum + room.peersCount, 0),
        totalTransports: roomStats.reduce(
          (sum, room) => sum + room.peers.reduce((s, p) => s + p.transportsCount, 0),
          0,
        ),
        totalProducers: roomStats.reduce(
          (sum, room) => sum + room.peers.reduce((s, p) => s + p.producersCount, 0),
          0,
        ),
        totalConsumers: roomStats.reduce(
          (sum, room) => sum + room.peers.reduce((s, p) => s + p.consumersCount, 0),
          0,
        ),
      },
    };
  }

  /**
   * 서버 헬스체크
   */
  @Get('health')
  @ApiOperation({ summary: '서버 헬스체크' })
  healthCheck() {
    const stats = this.mediasoupService.getStats();

    return {
      status: 'ok',
      workers: stats.workersCount,
      workersAlive: stats.workers.filter(w => !w.died).length,
      timestamp: new Date().toISOString(),
    };
  }
}
