import { ProjectNotificationDto } from '../dto/project-notification.dto';

export abstract class ProjectNotificationService {

  // 프로젝트 변경 사항 알림
  abstract notifyProjectChange(notificationDto: ProjectNotificationDto): Promise<void>;

  // 프로젝트 추가 알림
  abstract notifyProjectAdded(projectPk: number, projectName: string, serverUrl: string): Promise<void>;

  // 프로젝트 삭제 알림
  abstract notifyProjectRemoved(projectPk: number, projectName: string, serverUrl: string): Promise<void>;

  // 프로젝트 정보 수정 알림
  abstract notifyProjectUpdated(projectPk: number, projectName: string, serverUrl: string): Promise<void>;
}
