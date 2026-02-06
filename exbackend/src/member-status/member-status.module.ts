import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberStatusController } from './member-status.controller';
import { ProjectMemberUpdateService } from '../domain/project/services/project-member-update.service';
import { ProjectMember } from '../domain/project/entities/project-member.entity';
import { Channel } from '../domain/text-channel/entities/channel.entity';
import { Project } from '../domain/project/entities/project.entity';
import { Server } from '../domain/server/entities/server.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember, Channel, Project, Server]),
  ],
  controllers: [MemberStatusController],
  providers: [ProjectMemberUpdateService],
  exports: [ProjectMemberUpdateService],
})
export class MemberStatusModule {}
