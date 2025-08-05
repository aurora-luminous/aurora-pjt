import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerMember } from '../../entities/server-member.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { PermissionService } from './services/permission.service';
import { PermissionController } from './controllers/permission.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServerMember, 
      ProjectMember, 
      ChannelMember
    ])
  ],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionManagementModule {}