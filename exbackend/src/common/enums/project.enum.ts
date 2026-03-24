/**
 * 프로젝트 삭제 상태
 */
export const ProjectStatus = {
  ACTIVE: false,
  DELETED: true,
} as const;

/**
 * 프로젝트 상태 유틸리티
 */
export class ProjectStatusUtils {
  static getActiveCondition() {
    return { isDeletedProject: ProjectStatus.ACTIVE };
  }
  static getDeletedCondition() {
    return { isDeletedProject: ProjectStatus.DELETED };
  }
}
