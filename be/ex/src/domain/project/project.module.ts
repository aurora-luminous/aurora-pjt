import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Server } from '../server/entities/server.entity';
import { ServerMember } from '../server/entities/server-member.entity';
import { User } from '../user/entities/user.entity';
import { Channel } from '../text-channel/entities/channel.entity';
import { ChannelMember } from '../text-channel/entities/channel-member.entity';
import { ProjectCreationService } from './services/project-creation.service';
import { ProjectInvitationService } from './services/project-invitation.service';
import { ProjectController } from './controllers/project.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      Server,
      ServerMember,
      User,
      Channel,
      ChannelMember,
    ]),
  ],
  controllers: [
    ProjectController,
  ],
  providers: [
    ProjectCreationService,
    ProjectInvitationService,
  ],
  exports: [
    ProjectCreationService,
    ProjectInvitationService,
  ],
})
export class ProjectModule {}