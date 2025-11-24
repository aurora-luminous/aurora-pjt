import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MemberNotificationDto {
  eventType: 'MEMBER_ADDED' | 'MEMBER_REMOVED';
  projectPk: number;
  userPk: number;
  userName: string;
  projectRole: string;
  timestamp: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly springBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.springBaseUrl = this.configService.get('SPRING_BASE_URL', 'http://localhost:8080');
  }

  async notifyMemberChange(notificationDto: MemberNotificationDto): Promise<void> {
    try {
      const response = await fetch(`${this.springBaseUrl}/jv/api/userstate/member/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notificationDto,
          timestamp: Date.now(), // 현재 타임스탬프로 설정
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      this.logger.log(`Member notification sent successfully: ${result}`);
    } catch (error) {
      this.logger.error(`Failed to send member notification: ${error.message}`, error.stack);
      // 알림 실패가 주 로직을 방해하지 않도록 에러를 던지지 않음
    }
  }

  async notifyMemberAdded(projectPk: number, userPk: number, userName: string, projectRole: string): Promise<void> {
    await this.notifyMemberChange({
      eventType: 'MEMBER_ADDED',
      projectPk,
      userPk,
      userName,
      projectRole,
      timestamp: Date.now(),
    });
  }

  async notifyMemberRemoved(projectPk: number, userPk: number, userName: string, projectRole: string): Promise<void> {
    await this.notifyMemberChange({
      eventType: 'MEMBER_REMOVED',
      projectPk,
      userPk,
      userName,
      projectRole,
      timestamp: Date.now(),
    });
  }
}