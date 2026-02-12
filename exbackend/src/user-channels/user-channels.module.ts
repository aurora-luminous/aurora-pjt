import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserChannelsController } from './user-channels.controller';
import { ChannelCreationService } from '../domain/text-channel/services/channel-creation.service';
import { ChannelMember } from '../domain/text-channel/entities/channel-member.entity';
import { Channel } from '../domain/text-channel/entities/channel.entity';
import { Project } from '../domain/project/entities/project.entity';
import { ProjectMember } from '../domain/project/entities/project-member.entity';
import { User } from '../domain/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelMember, Channel, Project, ProjectMember, User]),
  ],
  controllers: [UserChannelsController],
  providers: [ChannelCreationService],
  exports: [ChannelCreationService],
})
export class UserChannelsModule {}
