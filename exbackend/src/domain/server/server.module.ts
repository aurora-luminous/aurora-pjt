import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { ServerRolePermission } from './entities/server-role-permission.entity';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { ChannelModule } from '../channel/channel.module';
import { ServerService } from './services/server.service';
import { ServerMemberService } from './services/server-member.service';
import { ServerMemberManagementService } from './services/server-member-management.service';
import { ServerRolePermissionService } from './services/server-role-permission.service';
import { ServerServiceImpl } from './services/servicesImpl/server.service.impl';
import { ServerMemberServiceImpl } from './services/servicesImpl/server-member.service.impl';
import { ServerMemberManagementServiceImpl } from './services/servicesImpl/server-member-management.service.impl';
import { ServerRolePermissionServiceImpl } from './services/servicesImpl/server-role.service.impl';
import { ServerController } from './controllers/server.controller';
import { ServerRolePermissionController } from './controllers/server-role-permission.controller';
import { ServerRepository } from './repositories/server.repository';
import { TypeOrmServerRepository } from './repositories/repositoriesImpl/typeorm-server.repository.impl';
import { ServerMemberRepository } from './repositories/server-member.repository';
import { TypeOrmServerMemberRepository } from './repositories/repositoriesImpl/typeorm-server-member.repository';
import { ServerRoleRepository } from './repositories/server-role.repository';
import { TypeOrmServerRoleRepository } from './repositories/repositoriesImpl/typeorm-server-role.repository.impl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      ServerMember,
      ServerRolePermission,
    ]),
    UserModule,
    forwardRef(() => ProjectModule),
    ChannelModule,
  ],
  controllers: [ServerController, ServerRolePermissionController],
  providers: [
    {
      provide: ServerService,
      useClass: ServerServiceImpl
    },
    {
      provide: ServerMemberService,
      useClass: ServerMemberServiceImpl
    },
    {
      provide: ServerMemberManagementService,
      useClass: ServerMemberManagementServiceImpl
    },
    {
      provide: ServerRolePermissionService,
      useClass: ServerRolePermissionServiceImpl
    },
    {
      provide: ServerRepository,
      useClass: TypeOrmServerRepository
    },
    {
      provide: ServerMemberRepository,
      useClass: TypeOrmServerMemberRepository
    },
    {
      provide: ServerRoleRepository,
      useClass: TypeOrmServerRoleRepository
    }
  ],
  exports: [
    ServerService,
    ServerMemberService,
    ServerMemberManagementService,
    ServerRolePermissionService,
    ServerRepository,
    ServerMemberRepository,
    ServerRoleRepository,
  ],
})
export class ServerModule {}
