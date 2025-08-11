import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { User } from '../user/entities/user.entity';
import { ChannelCreationService } from './services/channel-creation.service';
import { ChannelController } from './controllers/channel.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channel,
      ChannelMember,
      Project,
      ProjectMember,
      User,
    ]),
  ],
  controllers: [
    ChannelController,
  ],
  providers: [
    ChannelCreationService,
  ],
  exports: [
    ChannelCreationService,
  ],
})
export class TextChannelModule {}