import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelNotificationService } from '../channel-notofication.service';
import {
  ChannelMemberNotificationDto,
  ChannelNotificationDto,
} from '../../dto';

@Injectable()
export class ChannelNotificationServiceImpl extends ChannelNotificationService {
  private readonly logger = new Logger(ChannelNotificationServiceImpl.name);
  private readonly springBaseUrl: string;
  private readonly internalSecret: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.springBaseUrl = this.configService.get(
      'SPRING_BASE_URL',
      'http://localhost:8080',
    );
    this.internalSecret = this.configService.get(
      'INTERNAL_SECRET',
      'NeedApiKey',
    );
  }

  // 멤버 알림 구현
  async notifyMemberAdded(
    channelPks: number[],
    userEmail: string,
    userName: string,
    profileImagePath: string,
  ): Promise<void> {
    await this._sendMemberNotification({
      eventType: 'MEMBER_ADDED',
      channelPks,
      userEmail,
      userName,
      profileImagePath,
    });
  }

  async notifyMemberRemoved(
    channelPks: number[],
    userEmail: string,
    userName: string,
    profileImagePath: string,
  ): Promise<void> {
    await this._sendMemberNotification({
      eventType: 'MEMBER_REMOVED',
      channelPks,
      userEmail,
      userName,
      profileImagePath,
    });
  }

  async notifyMemberUpdated(
    channelPks: number[],
    userEmail: string,
    userName: string,
    profileImagePath: string,
  ): Promise<void> {
    await this._sendMemberNotification({
      eventType: 'MEMBER_UPDATED',
      channelPks,
      userEmail,
      userName,
      profileImagePath,
    });
  }

  // 채널 알림 구현
  async notifyChannelAdded(
    channelPk: number,
    channelName: string,
    projectPk: number,
  ): Promise<void> {
    await this._sendChannelNotification({
      eventType: 'CHANNEL_ADDED',
      channelPk,
      channelName,
      projectPk,
    });
  }

  async notifyChannelRemoved(
    channelPk: number,
    channelName: string,
    projectPk: number,
  ): Promise<void> {
    await this._sendChannelNotification({
      eventType: 'CHANNEL_REMOVED',
      channelPk,
      channelName,
      projectPk,
    });
  }

  async notifyChannelUpdated(
    channelPk: number,
    channelName: string,
    projectPk: number,
  ): Promise<void> {
    await this._sendChannelNotification({
      eventType: 'CHANNEL_UPDATED',
      channelPk,
      channelName,
      projectPk,
    });
  }

  // --- 내부 공통 전송 로직

  //   멤버 변경 알림
  private async _sendMemberNotification(
    dto: ChannelMemberNotificationDto,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.springBaseUrl}/api/jv/internal/member/notify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': this.internalSecret,
          },
          body: JSON.stringify({ ...dto, timestamp: Date.now() }),
        },
      );

      if (!response.ok)
        this.logger.error(
          `Member notification HTTP error! status: ${response.status}`,
        );
    } catch (error) {
      this.logger.error(`Failed to send member notification: ${error.message}`);
    }
  }

  //   채널 변경 알림
  private async _sendChannelNotification(
    dto: ChannelNotificationDto,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.springBaseUrl}/api/jv/internal/channel/notify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': this.internalSecret,
          },
          body: JSON.stringify({ ...dto, timestamp: Date.now() }),
        },
      );

      if (!response.ok)
        this.logger.error(
          `Channel notification HTTP error! status: ${response.status}`,
        );
    } catch (error) {
      this.logger.error(
        `Failed to send channel notification: ${error.message}`,
      );
    }
  }
}
