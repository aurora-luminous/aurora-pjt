import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectNotificationDto } from '../../dto/project-notification.dto';
import { ProjectNotificationService } from '../project-notification.service';

@Injectable()
export class ProjectNotificationServiceImpl extends ProjectNotificationService {
  private readonly logger = new Logger(ProjectNotificationService.name);
  private readonly springBaseUrl: string;
  private readonly internalSecret: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.springBaseUrl = this.configService.get('SPRING_BASE_URL', 'http://localhost:8080');
    this.internalSecret = this.configService.get('INTERNAL_SECRET', 'NeedApiKey');
  }

  async notifyProjectChange(notificationDto: ProjectNotificationDto): Promise<void> {
    try {
      const response = await fetch(`${this.springBaseUrl}/api/jv/internal/project/notify`, {
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
      this.logger.log(`Project notification sent successfully: ${result}`);
    } catch (error) {
      this.logger.error(`Failed to send project notification: ${error.message}`, error.stack);
    }
  }

  async notifyProjectAdded(projectPk: number, projectName: string, serverUrl: string): Promise<void> {
    await this.notifyProjectChange({
      eventType: 'PROJECT_ADDED',
      projectPk,
      projectName,
      serverUrl,
    });
  }

  async notifyProjectRemoved(projectPk: number, projectName: string, serverUrl: string): Promise<void> {
    await this.notifyProjectChange({
      eventType: 'PROJECT_REMOVED',
      projectPk,
      projectName,
      serverUrl,
    });
  }

  async notifyProjectUpdated(projectPk: number, projectName: string, serverUrl: string): Promise<void> {
    await this.notifyProjectChange({
      eventType: 'PROJECT_UPDATE',
      projectPk,
      projectName,
      serverUrl,
    });
  }
}