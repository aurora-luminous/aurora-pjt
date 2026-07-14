import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SfuGateway } from './gateways/sfu.gateway';
import { MediasoupService } from './services/mediasoup.service';
import { RoomService } from './services/room.service';
import { SfuController } from './controllers/sfu.controller';

@Module({
  imports: [HttpModule],
  controllers: [SfuController],
  providers: [
    MediasoupService,
    RoomService,
    SfuGateway,
  ],
  exports: [
    MediasoupService,
    RoomService,
    SfuGateway,
  ],
})
export class SfuModule {}