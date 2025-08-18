import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectCreationService } from '../services/project-creation.service';
import { ProjectInvitationService } from '../services/project-invitation.service';
import {
  CreateProjectDto,
  ProjectListDto,
  UserEmailDto,
  BulkInviteToProjectDto,
  ProjectMemberDto,
  ManageMemberDto,
} from '../dto';

@ApiTags('projects')
@Controller()
export class ProjectController {
  constructor(
    private readonly projectCreationService: ProjectCreationService,
    private readonly projectInvitationService: ProjectInvitationService,
  ) {}

  @Post()
  @ApiOperation({ summary: '프로젝트 생성' })
  @ApiResponse({
    status: 201,
    description: '프로젝트 생성 성공',
    type: ProjectListDto,
  })
  async createProject(
    @Param('serverUrl') serverUrl: string,
    @Body()
    createProjectDto: Omit<
      CreateProjectDto,
      'serverUrl' | 'serverPk' | 'creatorUserPk'
    >,
  ): Promise<ProjectListDto> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
    const creatorUserPk = 1; // 임시 하드코딩

    const completeProjectDto: CreateProjectDto = {
      ...createProjectDto,
      serverUrl: serverUrl,
      creatorUserPk: creatorUserPk,
    };
    const result =
      await this.projectCreationService.createProject(completeProjectDto);
    return {
      projectPk: result.projectPk,
      projectName: result.projectName,
    };
  }

  @Get()
  @ApiOperation({ summary: '해당 서버의 유저별 프로젝트 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '프로젝트 목록 조회 성공',
    type: [ProjectListDto],
  })
  async getProjectsByServer(
    @Param('serverUrl') serverUrl: string,
  ): Promise<ProjectListDto[]> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const requestUserPk = 1; // 임시 하드코딩

    const projects =
      await this.projectCreationService.getProjectsByServerForUser(
        serverUrl,
        requestUserPk,
      );
    return projects.map((project) => ({
      projectPk: project.projectPk,
      projectName: project.projectName,
    }));
  }

  // === 프로젝트 초대 관련 엔드포인트 ===

  @Post(':projectPk/invite')
  @ApiOperation({ summary: '프로젝트에 사용자들 초대' })
  @ApiResponse({ status: 201, description: '초대 성공' })
  async inviteUsersToProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() users: UserEmailDto[],
  ): Promise<{ message: string }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const inviterUserPk = 1; // 임시 하드코딩

    const bulkInviteDto: BulkInviteToProjectDto = {
      users: users,
      projectPk: projectPk,
      inviterUserPk: inviterUserPk,
    };

    await this.projectInvitationService.bulkInviteUsersToProject(bulkInviteDto);
    return { message: '초대 완료' };
  }

  @Get(':projectPk/members')
  @ApiOperation({ summary: '프로젝트 멤버 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '멤버 목록 조회 성공',
    type: [ProjectMemberDto],
  })
  async getProjectMembers(
    @Param('projectPk', ParseIntPipe) projectPk: number,
  ): Promise<ProjectMemberDto[]> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const requestUserPk = 1; // 임시 하드코딩

    return this.projectInvitationService.getProjectMembers(
      projectPk,
      requestUserPk,
    );
  }

  @Patch(':projectPk/members/remove')
  @ApiOperation({ summary: '프로젝트에서 사용자 제거' })
  @ApiResponse({ status: 200, description: '사용자 제거 성공' })
  async removeUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
  ): Promise<{ message: string }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const adminUserPk = 1; // 임시 하드코딩

    await this.projectInvitationService.removeUserFromProjectByEmail(
      projectPk,
      manageMemberDto.userEmail,
      adminUserPk,
    );
    return { message: "사용자 퇴장 성공" };
  }

  @Patch(':projectPk/members/ban')
  @ApiOperation({ summary: '프로젝트에서 사용자 차단' })
  @ApiResponse({ status: 200, description: '사용자 차단 성공' })
  async banUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
  ): Promise<{ message: string }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const adminUserPk = 1; // 임시 하드코딩

    return this.projectInvitationService.banUserFromProjectByEmail(
      projectPk,
      manageMemberDto.userEmail,
      adminUserPk,
    );
  }

  @Patch(':projectPk/members/unban')
  @ApiOperation({ summary: '프로젝트에서 사용자 차단 해제' })
  @ApiResponse({ status: 200, description: '차단 해제 성공' })
  async unbanUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
  ): Promise<{ message: string }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const ownerUserPk = 1; // 임시 하드코딩

    await this.projectInvitationService.unbanUserFromProjectByEmail(
      projectPk,
      manageMemberDto.userEmail,
      ownerUserPk,
    );
    return { message: '차단 해제 성공' };
  }
}
