import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { ChannelNotificationService } from './channel-notification.service';

@Injectable()
export class ChannelDeletionService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    private readonly channelNotificationService: ChannelNotificationService,
  ) {}

  async deleteChannel(channelPk: number, deleterUserPk: number): Promise<void> {
    // 1. 채널 존재 및 삭제 여부 확인
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false },
    });
    if (!channel) {
      throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없거나 이미 삭제되었습니다.`);
    }

    // 2. 권한 확인 (삭제하려는 사용자가 채널의 admin인지 확인)
    const deleterMember = await this.channelMemberRepository.findOne({
      where: { channelPk, userPk: deleterUserPk, channelRole: 'admin' },
    });

    if (!deleterMember) {
      throw new UnauthorizedException('채널을 삭제할 권한이 없습니다. 채널 admin만 삭제할 수 있습니다.');
    }

    // 3. 활성 멤버 있으면 비활성으로 변경
    await this.channelMemberRepository.update(
      { channelPk, cStatus: 'Active' },
      { cStatus: 'Inactive' },
    )

    // 4. 채널 소프트 삭제
    await this.channelRepository.update(channelPk, { isDeletedChannel: true });

    // 알림 전송 (비동기)
    this.channelNotificationService.notifyChannelRemoved(channel.channelPk, channel.channelName, channel.projectPk);
  }
}
