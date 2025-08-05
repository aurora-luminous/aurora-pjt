import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../../entities/server.entity';
import { Project } from '../../entities/project.entity';
import { Channel } from '../../entities/channel.entity';
import { ServerMember } from '../../entities/server-member.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { User } from '../../entities/user.entity';
import { WorkspaceController } from './controllers/workspace.controller';
import { ServerCreationService } from './services/server-creation.service';
import { ProjectCreationService } from './services/project-creation.service';
import { ChannelCreationService } from './services/channel-creation.service';
import { ServerInvitationController } from './controllers/server-invitation.controller';
import { ServerInvitationService } from './services/server-invitation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server, 
      Project, 
      Channel,
      ServerMember, 
      ProjectMember,
      ChannelMember,
      User
    ])
  ],
  controllers: [
    WorkspaceController,
    ServerInvitationController,
  ],
  providers: [
    ServerCreationService,
    ProjectCreationService,
    ChannelCreationService,
    ServerInvitationService,
  ],
  exports: [
    ServerCreationService,
    ProjectCreationService,
    ChannelCreationService,
    ServerInvitationService,
  ],
})
export class WorkspaceManagementModule {}