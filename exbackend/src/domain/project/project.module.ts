import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Server } from '../server/entities/server.entity';
import { ServerMember } from '../server/entities/server-member.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { Channel } from '../channel/entities/channel.entity';
import { ChannelMember } from '../channel/entities/channel-member.entity';
import { ProjectRepository } from './repositories/project.repository';
import { TypeOrmProjectRepository } from './repositories/repositoriesImpl/typeorm-project.repository';
import { ProjectMemberRepository } from './repositories/project-member.repository';
import { TypeOrmProjectMemberRepository } from './repositories/repositoriesImpl/typeorm-project-member.repository';
import { ProjectService } from './services/project.service';
import { ProjectServiceImpl } from './services/servicesImpl/project.service.impl';
import { ProjectMemberService } from './services/project-member.service';
import { ProjectMemberServiceImpl } from './services/servicesImpl/project-member.service.impl';
import { ProjectNotificationService } from './services/project-notification.service';
import { ProjectNotificationServiceImpl } from './services/servicesImpl/project-notification.service.impl';
import { ProjectController } from './controllers/project.controller';
import { ChannelModule } from '../channel/channel.module';


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
    UserModule,
    ChannelModule,
  ],
  controllers: [ProjectController],
  providers: [
    {
      provide: ProjectRepository,
      useClass: TypeOrmProjectRepository
    },
    {
      provide: ProjectMemberRepository,
      useClass: TypeOrmProjectMemberRepository
    },
    {
      provide: ProjectService,
      useClass: ProjectServiceImpl
    },
    {
      provide: ProjectMemberService,
      useClass: ProjectMemberServiceImpl
    },
    {
      provide: ProjectNotificationService,
      useClass: ProjectNotificationServiceImpl
    },

  ],
  exports: [
    ProjectService,
    ProjectMemberService,
    ProjectNotificationService,
    ProjectRepository,
    ProjectMemberRepository,
  ],
})
export class ProjectModule {}
