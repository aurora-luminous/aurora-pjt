import { Module } from '@nestjs/common';
import { SfuValidationController } from './controllers/sfu-validation.controller';
import { TextChannelModule } from '../domain/text-channel/text-channel.module'; // Import TextChannelModule

@Module({
  imports: [TextChannelModule],
  controllers: [SfuValidationController],
  providers: [],
})
export class SfuValidationModule {}
