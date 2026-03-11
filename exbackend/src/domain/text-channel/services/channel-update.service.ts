import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { ChannelNotificationService } from './channel-notification.service';

@Injectable()
export class ChannelUpdateService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelRepository: Repository<Channel>,
        @InjectRepository(ChannelMember)
        private readonly channelMemberRepository: Repository<ChannelMember>,
        private readonly channelNotificationService: ChannelNotificationService,
    ) {}

    async updateChannelName(
        projectPk: number,
        channelPk: number,
        newChannelName: string,
        modifierUserPk: number,
    ): Promise<Channel> {

        // 1. 채널 찾기
        const channel = await this.channelRepository.findOne({
            where: { channelPk, projectPk, isDeletedChannel: false },
        });
        if (!channel) {
            throw new NotFoundException(`채널 ID ${channelPk}를 찾을 수 없습니다.`);
        }

        // 2. 요청 보내는 멤버 권한 확인
        const channelMember = await this.channelMemberRepository.findOne({
            where: { channelPk, userPk: modifierUserPk, cStatus: 'Active' },
        });

        // 채널 멤버가 아니거나 권한이 admin이 아닐 경우 에러 던짐
        if (!channelMember || channelMember.channelRole !== 'admin') {
            throw new ForbiddenException('채널 이름을 변경할 권한이 없습니다.');
        }

        // 3. 채널 이름 갱신 후 DB에 반영
        channel.channelName = newChannelName;

        await this.channelRepository.save(channel);

        // 알림 전송 (비동기)
        this.channelNotificationService.notifyChannelUpdated(channel.channelPk, channel.channelName);

        return channel;
    }
}
