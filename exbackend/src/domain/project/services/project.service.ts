import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto, ProjectListDto } from '../dto';

export abstract class ProjectService {

  // 새 프로젝트 생성
  abstract createProject(dto: CreateProjectDto): Promise<ProjectResponseDto>;

  // 프로젝트 정보 수정(이름)
  abstract updateProject(
    projectPk: number,
    projectName: string,
    userPk: number
  ): Promise<{ message: string }>;

  // 프로젝트 삭제
  abstract deleteProject(projectPk: number, deleteUserPk: number): Promise<void>;

  // 한 서버의 모든 프로젝트 목록 조회
  abstract getProjectsByServer(serverUrl: string): Promise<ProjectListDto[]>;

  // 한 서버에서 특정 유저가 속한 프로젝트 목록 조회
  abstract getProjectByServerForUser(serverUrl: string, userPk: number): Promise<ProjectListDto[]>;

}