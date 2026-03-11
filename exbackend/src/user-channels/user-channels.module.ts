import { Module } from '@nestjs/common';
import { UserChannelsController } from './user-channels.controller';
import { TextChannelModule } from '../domain/text-channel/text-channel.module';

@Module({
  imports: [
    TextChannelModule,
  ],
  controllers: [UserChannelsController],
  providers: [],
  exports: [],
})
export class UserChannelsModule {}
