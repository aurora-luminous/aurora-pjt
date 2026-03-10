export type ProjectEventType = 'PROJECT_ADDED' | 'PROJECT_REMOVED' | 'PROJECT_UPDATE';

export interface ProjectNotificationDto {
  eventType: ProjectEventType;
  projectPk: number;
  projectName: string;
}
