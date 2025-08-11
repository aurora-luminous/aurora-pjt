import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectCreationService } from '../services/project-creation.service';
import { CreateProjectDto, ProjectResponseDto } from '../dto';

@ApiTags('projects')
@Controller()
export class ProjectController {
  constructor(
    private readonly projectCreationService: ProjectCreationService,
  ) {}

  @Post()
  @ApiOperation({ summary: '프로젝트 생성' })
  @ApiResponse({ status: 201, description: '프로젝트 생성 성공' })
  async createProject(
    @Param('serverPk', ParseIntPipe) serverPk: number,
    @Body() createProjectDto: Omit<CreateProjectDto, 'serverPk' | 'creatorUserPk'>
  ): Promise<ProjectResponseDto> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
    const creatorUserPk = 1; // 임시 하드코딩

    const completeProjectDto: CreateProjectDto = {
      ...createProjectDto,
      serverPk: serverPk,
      creatorUserPk: creatorUserPk
    };
    return this.projectCreationService.createProject(completeProjectDto);
  }

  @Get()
  @ApiOperation({ summary: '서버별 프로젝트 목록 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 목록 조회 성공' })
  async getProjectsByServer(@Param('serverPk', ParseIntPipe) serverPk: number): Promise<ProjectResponseDto[]> {
    return this.projectCreationService.getProjectsByServer(serverPk);
  }

  @Get(':projectPk')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 조회 성공' })
  async getProjectById(@Param('projectPk', ParseIntPipe) projectPk: number): Promise<ProjectResponseDto> {
    return this.projectCreationService.getProjectById(projectPk);
  }
}