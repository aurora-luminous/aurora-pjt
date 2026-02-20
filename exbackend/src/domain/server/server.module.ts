import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { ServerRolePermission } from './entities/server-role-permission.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { Channel } from '../text-channel/entities/channel.entity';
import { ChannelMember } from '../text-channel/entities/channel-member.entity';
import { ServerCreationService } from './services/server-creation.service';
import { ServerInvitationService } from './services/server-invitation.service';
import { ServerRolePermissionService } from './services/server-role-permission.service';
import { ServerDeletionService } from './services/server-deletion.service';
import { ServerController } from './controllers/server.controller';
import { ServerRolePermissionController } from './controllers/server-role-permission.controller';
import { ProjectModule } from '../project/project.module';
import { ServerMemberManagementService } from './services/server-member-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      ServerMember,
      ServerRolePermission,
      User,
      Project,
      ProjectMember,
      Channel,
      ChannelMember,
    ]),
    UserModule,
    ProjectModule,
  ],
  controllers: [
    ServerController,
    ServerRolePermissionController,
  ],
  providers: [
    ServerCreationService,
    ServerInvitationService,
    ServerMemberManagementService,
    ServerRolePermissionService,
    ServerDeletionService,
  ],
  exports: [
    ServerCreationService,
    ServerInvitationService,
    ServerMemberManagementService,
    ServerRolePermissionService,
    ServerDeletionService,
  ],
})
export class ServerModule {}