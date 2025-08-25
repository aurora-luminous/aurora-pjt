import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { ServerCreationService } from './services/server-creation.service';
import { ServerInvitationService } from './services/server-invitation.service';
import { ServerController } from './controllers/server.controller';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      ServerMember,
      User,
      Project,
      ProjectMember,
    ]),
    ProjectModule,
  ],
  controllers: [
    ServerController,
  ],
  providers: [
    ServerCreationService,
    ServerInvitationService,
  ],
  exports: [
    ServerCreationService,
    ServerInvitationService,
  ],
})
export class ServerModule {}