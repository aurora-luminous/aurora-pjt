import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../../entities/channel.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { MediaService } from './services/media.service';
import { MediaController } from './controllers/media.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelMember])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaCommunicationModule {}