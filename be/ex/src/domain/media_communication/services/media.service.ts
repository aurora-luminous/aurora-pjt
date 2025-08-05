import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../../../entities/channel.entity';
import { ChannelMember } from '../../../entities/channel-member.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
  ) {}

  // TODO: 미디어 커뮤니케이션 기능 구현 예정
}