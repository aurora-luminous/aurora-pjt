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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth';
import { CurrentUser, User } from '../../user'
import { Project } from '../entities/project.entity';
import { ProjectService } from '../services/project.service';
import { ProjectMemberService } from '../services/project-member.service';
import {
  CreateProjectDto,
  ProjectListDto,
  UserEmailDto,
  BulkInviteToProjectDto,
  ProjectMemberDto,
  ManageMemberDto,
  UpdateProjectDto,
  ProjectMemberUserInfoDto,
} from '../dto';

@ApiTags('projects')
@Controller('servers/:serverUrl/projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectMemberService: ProjectMemberService,
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
    @CurrentUser() user: User,
  ): Promise<ProjectListDto> {
    const creatorUserPk = user.userPk;

    const completeProjectDto: CreateProjectDto = {
      ...createProjectDto,
      serverUrl: serverUrl,
      creatorUserPk: creatorUserPk,
    };
    const result =
      await this.projectService.createProject(completeProjectDto);
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
    @CurrentUser() user: User,
  ): Promise<ProjectListDto[]> {
    const requestUserPk = user.userPk;

    return await this.projectService.getProjectByServerForUser(
      serverUrl,
      requestUserPk,
    );
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
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const inviterUserPk = user.userPk;

    const bulkInviteDto: BulkInviteToProjectDto = {
      users: users,
      projectPk: projectPk,
      inviterUserPk: inviterUserPk,
    };

    await this.projectMemberService.inviteMembers(bulkInviteDto);
    return { message: '초대 완료' };
  }

  // 조회지만 민감한 정보(이메일) 받음 -> post로 통신
  @Post(':projectPk/member')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트 멤버 검색' })
  @ApiResponse({
    status: 200,
    description: '멤버 검색 성공',
    type: [ProjectMemberUserInfoDto],
  })
  async getProjectMember(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() targetUser: UserEmailDto
  ): Promise<ProjectMemberUserInfoDto> {

    return this.projectMemberService.getProjectMember(
      projectPk,
      targetUser.userEmail
    );
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
    @CurrentUser() user: User,
  ): Promise<ProjectMemberDto[]> {
    const requestUserPk = user.userPk;

    return this.projectMemberService.getProjectMembers(
      projectPk,
      requestUserPk
    );
  }

  @Patch(':projectPk/members/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트에서 사용자 제거' })
  @ApiResponse({ status: 200, description: '사용자 제거 성공' })
  async removeUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() userEmail: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const adminUserPk = user.userPk;

    await this.projectMemberService.removeMember(
      projectPk,
      userEmail,
      adminUserPk,
    );
    return { message: '사용자 퇴장 성공' };
  }

  @Patch(':projectPk/members/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트에서 사용자 차단' })
  @ApiResponse({ status: 200, description: '사용자 차단 성공' })
  async banUserFromProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const adminUserPk = user.userPk;

    return this.projectMemberService.banMemberFromProject(
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
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const ownerUserPk = user.userPk;

    await this.projectMemberService.unbanMemberFromProject(
      projectPk,
      manageMemberDto.userEmail,
      ownerUserPk,
    );
    return { message: '차단 해제 성공' };
  }

  @Patch(':projectPk/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트 나가기 (PM 특별 로직 포함)' })
  @ApiResponse({ status: 200, description: '프로젝트 나가기 성공' })
  async leaveProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const userPk = user.userPk;

    // 프로젝트 나가기 로직 실행 (PM 검증 포함)
    const result = await this.projectMemberService.leaveProject(
      projectPk,
      userPk,
    );

    return result;
  }

  @Patch(':projectPk/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트 삭제 (Admin만 가능)' })
  @ApiResponse({ status: 200, description: '프로젝트 삭제 성공' })
  @ApiResponse({ status: 401, description: '프로젝트를 삭제할 권한 없음' })
  @ApiResponse({
    status: 400,
    description: '사용자가 존재하여 프로젝트를 삭제할 수 없음',
  })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  async deleteProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.projectService.deleteProject(projectPk, user.userPk);
    return { message: '프로젝트가 성공적으로 삭제되었습니다.' };
  }

  @Patch(':projectPk/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로젝트 이름 변경 (Admin만 가능)' })
  @ApiResponse({
    status: 200,
    description: '프로젝트 이름 변경 성공',
    type: Project,
  })
  @ApiResponse({ status: 403, description: '프로젝트 이름을 변경할 권한 없음' })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  async updateProjectName(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const modifierUserPk = user.userPk;
    await this.projectService.updateProject(
      projectPk,
      updateProjectDto.projectName,
      modifierUserPk,
    );
    return { message: '프로젝트가 성공적으로 업데이트 되었습니다.' };
  }
}
