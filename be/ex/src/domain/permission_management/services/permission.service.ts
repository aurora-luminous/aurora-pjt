import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerMember } from '../../../entities/server-member.entity';
import { ProjectMember } from '../../../entities/project-member.entity';
import { ChannelMember } from '../../../entities/channel-member.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
  ) {}

  // TODO: 권한 관리 기능 구현 예정
}