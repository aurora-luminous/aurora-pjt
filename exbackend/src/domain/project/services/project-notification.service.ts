import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectMemberNotificationDto } from '../dto';

@Injectable()
export class ProjectNotificationService {
  private readonly logger = new Logger(ProjectNotificationService.name);
  private readonly springBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.springBaseUrl = this.configService.get('SPRING_BASE_URL', 'http://localhost:8080');
  }

  async notifyMemberChange(notificationDto: ProjectMemberNotificationDto): Promise<void> {
    try {
      const response = await fetch(`${this.springBaseUrl}/jv/api/userstate/member/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      this.logger.log(`Project member notification sent successfully: ${result}`);
    } catch (error) {
      this.logger.error(`Failed to send project member notification: ${error.message}`, error.stack);
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