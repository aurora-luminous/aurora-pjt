import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { ProjectRepository } from "../project.repository";
import { EntityManager } from "typeorm";

@Injectable()
export class TypeOrmProjectRepository extends ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {
    super();
  }

    // 단일 프로젝트 조회(조건에 따라 상세 조회)
  async findOne(
    options: {
      projectPk?: number;
      serverPk?: number;
      projectName?: string;
      isDeletedProject?: boolean;
    },
    relations?: string[]
  ): Promise<Project | null> {

    const { projectPk, serverPk, projectName, isDeletedProject } = options;

    return this.projectRepository.findOne({
      where: {
        ...(projectPk && { projectPk }),
        ...(serverPk && { serverPk }),
        ...(projectName && { projectName }),
        isDeletedProject: isDeletedProject !== undefined ? isDeletedProject : false,
      },
      relations: relations || [],
    });
  };

  // 한 서버에 속한 모든 프로젝트 목록
  async findProjectsByServer(serverPk: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: {
        serverPk,
        isDeletedProject: false,
      },
      relations: ['projectMembers', 'projectMembers.user', 'server'],
    });
  };

  // 프로젝트 생성 및 업데이트(DB 반영)
  async save(project: Partial<Project>): Promise<Project> {
    return this.projectRepository.save(project);
  };

  // 프로젝트 삭제
  async delete(projectPk: number): Promise<void> {
    await this.projectRepository.update(projectPk, { isDeletedProject: true });
  };

  // 프로젝트 존재 여부
  async isExists(projectPk: number): Promise<boolean> {
    const count = await this.projectRepository.count({
      where: { projectPk, isDeletedProject: false },
    });
    return count > 0;
  };

  // 특정 서버의 모든 프로젝트 삭제
  async deleteAllByServer(manager: EntityManager, serverPk: number): Promise<void> {
    await manager.update(Project,
      { serverPk, isDeletedProject: false },
      { isDeletedProject: true }
    )
  }
}