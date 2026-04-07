import { Project } from "../entities/project.entity";

export abstract class ProjectRepository {

  // 단일 프로젝트 조회(조건에 따라 상세 조회)
  abstract findOne(
    options: {
      projectPk?: number;
      serverPk?: number;
      projectName?: string;
      isDeletedProject?: boolean;
    },
    relations?: string[]
  ): Promise<Project | null>;

  // 한 서버에 속한 모든 프로젝트 목록
  abstract findProjectsByServer(serverPk: number): Promise<Project[]>;

  // 프로젝트 생성 및 업데이트(DB 반영)
  abstract save(project: Partial<Project>): Promise<Project>;

  // 프로젝트 삭제
  abstract delete(projectPk: number): Promise<void>;

  // 프로젝트 존재 여부
  abstract isExists(projectPk: number): Promise<boolean>;
}