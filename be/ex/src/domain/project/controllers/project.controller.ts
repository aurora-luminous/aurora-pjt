import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../user/entities/user.entity';
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
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
    @CurrentUser() user: User
  ): Promise<ProjectListDto> {
    const creatorUserPk = user.userPk;

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '해당 서버의 유저별 프로젝트 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '프로젝트 목록 조회 성공',
    type: [ProjectListDto],
  })
  async getProjectsByServer(
    @Param('serverUrl') serverUrl: string,
    @CurrentUser() user: User
  ): Promise<ProjectListDto[]> {
    const requestUserPk = user.userPk;

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트에 사용자들 초대' })
  @ApiResponse({ status: 201, description: '초대 성공' })
  async inviteUsersToProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() users: UserEmailDto[],
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const inviterUserPk = user.userPk;

    const bulkInviteDto: BulkInviteToProjectDto = {
      users: users,
      projectPk: projectPk,
      inviterUserPk: inviterUserPk,
    };

    await this.projectInvitationService.bulkInviteUsersToProject(bulkInviteDto);
    return { message: '초대 완료' };
  }

  @Get(':projectPk/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트 멤버 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '멤버 목록 조회 성공',
    type: [ProjectMemberDto],
  })
  async getProjectMembers(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @CurrentUser() user: User
  ): Promise<ProjectMemberDto[]> {
    const requestUserPk = user.userPk;

    return this.projectInvitationService.getProjectMembers(
      projectPk,
      requestUserPk,
    );
  }

  @Patch(':projectPk/members/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트에서 사용자 제거' })
  @ApiResponse({ status: 200, description: '사용자 제거 성공' })
  async removeUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const adminUserPk = user.userPk;

    await this.projectInvitationService.removeUserFromProjectByEmail(
      projectPk,
      manageMemberDto.userEmail,
      adminUserPk,
    );
    return { message: "사용자 퇴장 성공" };
  }

  @Patch(':projectPk/members/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트에서 사용자 차단' })
  @ApiResponse({ status: 200, description: '사용자 차단 성공' })
  async banUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const adminUserPk = user.userPk;

    return this.projectInvitationService.banUserFromProjectByEmail(
      projectPk,
      manageMemberDto.userEmail,
      adminUserPk,
    );
  }

  @Patch(':projectPk/members/unban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트에서 사용자 차단 해제' })
  @ApiResponse({ status: 200, description: '차단 해제 성공' })
  async unbanUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const ownerUserPk = user.userPk;

    await this.projectInvitationService.unbanUserFromProjectByEmail(
      projectPk,
      manageMemberDto.userEmail,
      ownerUserPk,
    );
    return { message: '차단 해제 성공' };
  }
}
