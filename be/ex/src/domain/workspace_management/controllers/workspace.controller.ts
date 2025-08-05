import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServerCreationService, CreateServerDto, ServerResponseDto } from '../services/server-creation.service';
import { ProjectCreationService, CreateProjectDto, ProjectResponseDto } from '../services/project-creation.service';
import { ChannelCreationService, CreateChannelDto, ChannelResponseDto } from '../services/channel-creation.service';

@ApiTags('workspace-management')
@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly serverCreationService: ServerCreationService,
    private readonly projectCreationService: ProjectCreationService,
    private readonly channelCreationService: ChannelCreationService,
  ) {}

  // ================= 서버 관련 API =================
  @Post('servers')
  @ApiOperation({ summary: '서버 생성' })
  @ApiResponse({ status: 201, description: '서버 생성 성공' })
  async createServer(@Body() createServerDto: CreateServerDto): Promise<ServerResponseDto> {
    return this.serverCreationService.createServer(createServerDto);
  }

  @Get('servers')
  @ApiOperation({ summary: '전체 서버 목록 조회' })
  @ApiResponse({ status: 200, description: '서버 목록 조회 성공' })
  async getAllServers(): Promise<ServerResponseDto[]> {
    return this.serverCreationService.getAllServers();
  }

  @Get('servers/:serverPk')
  @ApiOperation({ summary: '서버 상세 조회' })
  @ApiResponse({ status: 200, description: '서버 조회 성공' })
  async getServerById(@Param('serverPk', ParseIntPipe) serverPk: number): Promise<ServerResponseDto> {
    return this.serverCreationService.getServerById(serverPk);
  }

  // ================= 프로젝트 관련 API =================
  @Post('servers/:serverPk/projects')
  @ApiOperation({ summary: '프로젝트 생성' })
  @ApiResponse({ status: 201, description: '프로젝트 생성 성공' })
  async createProject(
    @Param('serverPk', ParseIntPipe) serverPk: number,
    @Body() createProjectDto: Omit<CreateProjectDto, 'serverPk'>
  ): Promise<ProjectResponseDto> {
    const projectDto: CreateProjectDto = {
      ...createProjectDto,
      serverPk: serverPk
    };
    return this.projectCreationService.createProject(projectDto);
  }

  @Get('servers/:serverPk/projects')
  @ApiOperation({ summary: '서버별 프로젝트 목록 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 목록 조회 성공' })
  async getProjectsByServer(@Param('serverPk', ParseIntPipe) serverPk: number): Promise<ProjectResponseDto[]> {
    return this.projectCreationService.getProjectsByServer(serverPk);
  }

  @Get('projects/:projectPk')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 조회 성공' })
  async getProjectById(@Param('projectPk', ParseIntPipe) projectPk: number): Promise<ProjectResponseDto> {
    return this.projectCreationService.getProjectById(projectPk);
  }

  // ================= 채널 관련 API =================
  @Post('projects/:projectPk/channels')
  @ApiOperation({ summary: '채널 생성' })
  @ApiResponse({ status: 201, description: '채널 생성 성공' })
  async createChannel(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() createChannelDto: Omit<CreateChannelDto, 'projectPk'>
  ): Promise<ChannelResponseDto> {
    const channelDto: CreateChannelDto = {
      ...createChannelDto,
      projectPk: projectPk
    };
    return this.channelCreationService.createChannel(channelDto);
  }

  @Get('projects/:projectPk/channels')
  @ApiOperation({ summary: '프로젝트별 채널 목록 조회 (권한별 필터링)' })
  @ApiResponse({ status: 200, description: '채널 목록 조회 성공' })
  async getChannelsByProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
  ): Promise<ChannelResponseDto[]> {
    // 임시로 하드코딩 (추후 JWT 인증으로 변경)
    const requestUserPk = 1;
    return this.channelCreationService.getChannelsByProject(projectPk, requestUserPk);
  }

  @Get('channels/:channelPk')
  @ApiOperation({ summary: '채널 상세 조회' })
  @ApiResponse({ status: 200, description: '채널 조회 성공' })
  async getChannelById(@Param('channelPk', ParseIntPipe) channelPk: number): Promise<ChannelResponseDto> {
    return this.channelCreationService.getChannelById(channelPk);
  }
}