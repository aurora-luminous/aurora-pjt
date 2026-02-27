import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelMemberNotificationDto } from '../dto';

@Injectable()
export class ChannelNotificationService {
  private readonly logger = new Logger(ChannelNotificationService.name);
  private readonly springBaseUrl: string;
  private readonly internalSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.springBaseUrl = this.configService.get('SPRING_BASE_URL', 'http://localhost:8080');
    this.internalSecret = this.configService.get('INTERNAL_SECRET', 'NeedApiKey');
  }

  async notifyMemberChange(notificationDto: ChannelMemberNotificationDto): Promise<void> {
    try {
      const response = await fetch(`${this.springBaseUrl}/api/jv/internal/member/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.internalSecret,
        },
        body: JSON.stringify({
          ...notificationDto,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      this.logger.log(`Channel member notification sent successfully: ${result}`);
    } catch (error) {
      this.logger.error(`Failed to send channel member notification: ${error.message}`, error.stack);
      // 알림 실패가 주 로직을 방해하지 않도록 에러를 던지지 않음
    }
  }

  async notifyMemberAdded(channelPks: number[], userEmail: string, userName: string, profileImagePath: string): Promise<void> {
    await this.notifyMemberChange({
      eventType: 'MEMBER_ADDED',
      channelPks,
      userEmail,
      userName,
      profileImagePath,
    });
  }

  async notifyMemberRemoved(channelPks: number[], userEmail: string, userName: string, profileImagePath: string): Promise<void> {
    await this.notifyMemberChange({
      eventType: 'MEMBER_REMOVED',
      channelPks,
      userEmail,
      userName,
      profileImagePath,
    });
  }

  async notifyMemberUpdated(channelPks: number[], userEmail: string, userName: string, profileImagePath: string): Promise<void> {
    await this.notifyMemberChange({
      eventType: 'MEMBER_UPDATED',
      channelPks,
      userEmail,
      userName,
      profileImagePath,
    });
  }
}