import { Controller, Post, Get, Body, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServerCreationService } from '../services/server-creation.service';
import { ServerInvitationService } from '../services/server-invitation.service';
import { ServerMemberManagementService } from '../services/server-member-management.service';
import { CreateServerDto, ServerListDto, ServerCreateResponseDto, ServerMemberInfoDto, ServerMemberDetailDto } from '../dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../user/entities/user.entity';

@ApiTags('servers')
@Controller()
export class ServerController {
  constructor(
    private readonly serverCreationService: ServerCreationService,
    private readonly serverInvitationService: ServerInvitationService,
    private readonly serverMemberManagementService: ServerMemberManagementService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '서버 생성' })
  @ApiResponse({ status: 201, description: '서버 생성 성공' })
  async createServer(
    @Body() createServerDto: Omit<CreateServerDto, 'creatorUserPk'>,
    @CurrentUser() user: User
  ): Promise<ServerCreateResponseDto> {
    const creatorUserPk = user.userPk;

    const completeServerDto: CreateServerDto = {
      ...createServerDto,
      creatorUserPk: creatorUserPk
    };
    await this.serverCreationService.createServer(completeServerDto);
    return { message: "생성 완료" };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '유저가 속한 서버 목록 조회' })
  @ApiResponse({ status: 200, description: '서버 목록 조회 성공', type: [ServerListDto] })
  async getUserServers(
    @CurrentUser() user: User
  ): Promise<ServerListDto[]> {
    const requestUserPk = user.userPk;

    return await this.serverCreationService.getUserServers(requestUserPk);
  }

  @Post(':serverUrl/invite')
  @ApiOperation({ summary: '서버 초대 링크 생성' })
  @ApiResponse({ status: 201, description: '초대 링크 생성 성공' })
  @UseGuards(JwtAuthGuard) // ✅ 메서드 위에 데코레이터
  @ApiBearerAuth('access-token') // Swagger용
  async generateServerInviteLink(
    @Param('serverUrl') serverUrl: string,
    @CurrentUser() user: User // ✅ 매개변수로 추가
  ): Promise<{ inviteLink: string }> {
    const requestUserPk = user.userPk; // ✅ 하드코딩 대신 JWT에서 추출

    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);
    const result = await this.serverInvitationService.generateInviteLink(server.serverPk, requestUserPk);
    return { inviteLink: result.inviteLink };
  }

  @Get(':serverUrl/join/:inviteHash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '초대링크 서버 정보 조회' })
  @ApiResponse({ status: 200, description: '서버 정보 조회 성공' })
  async getServerInfoByInvite(
    @Param('serverUrl') serverUrl: string,
    @Param('inviteHash') inviteHash: string,
    @CurrentUser() user: User
  ): Promise<{
    serverUrl: string;
    serverName: string;
  }> {
    const userPk = user.userPk;

    const result = await this.serverInvitationService.getServerInfoByInvite({
      inviteHash,
      userPk
    });

    return {
      serverUrl: result.serverUrl,
      serverName: result.serverName
    };
  }

  @Post(':serverUrl/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '직접 서버 가입 신청' })
  @ApiResponse({ status: 200, description: '가입 신청 성공' })
  async joinServerDirect(
    @Param('serverUrl') serverUrl: string,
    @CurrentUser() user: User
  ): Promise<{
    sStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned';
    defaultProject?: {
      projectPk: number;
      projectName: string;
    };
    defaultChannel?: {
      channelPk: number;
      channelName: string;
    };
  }> {
    const userPk = user.userPk;

    const result = await this.serverInvitationService.joinServerDirect(serverUrl, userPk);
    return {
      sStatus: result.sStatus,
      ...(result.defaultProject && { defaultProject: result.defaultProject }),
      ...(result.defaultChannel && { defaultChannel: result.defaultChannel }),
    };
  }

  @Get(':serverUrl/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '서버 가입 대기 목록' })
  @ApiResponse({ status: 200, description: '대기 목록 조회 성공' })
  async getPendingMembers(
    @Param('serverUrl') serverUrl: string,
    @CurrentUser() user: User
  ): Promise<Array<{
    sStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned';
    userInfo: {
      user_name: string;
      user_email: string;
      profile_image_path: string;
    };
  }>> {
    const requestUserPk = user.userPk;

    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);
    const members = await this.serverInvitationService.getPendingMembers(server.serverPk, requestUserPk);

    // 명세서 형식에 맞게 변환
    return members.map(member => ({
      sStatus: member.sStatus,
      userInfo: {
        user_name: member.userInfo.user_name,
        user_email: member.userInfo.user_email,
        profile_image_path: member.userInfo.profile_image_path
      }
    }));
  }

  @Patch(':serverUrl/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '서버 멤버 승인/거절/밴' })
  @ApiResponse({ status: 200, description: '멤버 상태 변경 성공' })
  async updateMemberStatus(
    @Param('serverUrl') serverUrl: string,
    @Body() updateDto: {
      userEmail: string;
      sStatus: 'Active' | 'Inactive' | 'Banned';
    },
    @CurrentUser() user: User
  ): Promise<{
    sStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned';
    userInfo: {
      user_name: string;
      user_email: string;
      profile_image_path: string;
    };
  }> {
    const adminUserPk = user.userPk;

    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);

    const result = await this.serverInvitationService.updateMemberStatusByEmail(
      server.serverPk,
      updateDto.userEmail,
      updateDto.sStatus,
      adminUserPk
    );

    // 명세서 형식에 맞게 변환
    return {
      sStatus: result.sStatus,
      userInfo: {
        user_name: result.userInfo.user_name,
        user_email: result.userInfo.user_email,
        profile_image_path: result.userInfo.profile_image_path
      }
    };
  }

  @Get(':serverUrl/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '서버 멤버 목록 조회' })
  @ApiResponse({ status: 200, description: '멤버 목록 조회 성공' })
  async getServerMembers(
    @Param('serverUrl') serverUrl: string,
    @CurrentUser() user: User
  ): Promise<ServerMemberInfoDto[] | ServerMemberDetailDto[]> {
    const requestUserPk = user.userPk;

    return await this.serverInvitationService.getServerMembersByUrl(serverUrl, requestUserPk);
  }

  @Patch(':serverUrl/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '멤버 권한 일괄 변경 (Owner만 가능)' })
  async bulkUpdateMemberRoles(
    @Param('serverUrl') serverUrl: string,
    @Body() updateDto: {
      changes: Array<{
        userEmail: string;
        newRole: 'member' | 'admin';
      }>;
    },
    @CurrentUser() user: User
  ): Promise<{ processed: number; failed: Array<{ userEmail: string; reason: string }>}> {
    const ownerUserPk = user.userPk;

    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);

    // 권한 일괄 변경 실행
    const result = await this.serverMemberManagementService.bulkUpdateMemberRoles(
      server.serverPk,
      updateDto.changes,
      ownerUserPk
    );

    return {
      processed: result.processed,
      failed: result.failed
    };
  }

  @Patch(':serverUrl/members/bulk-action')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '멤버 일괄 강퇴/밴 (Admin 이상)' })
  @ApiResponse({ status: 200, description: '일괄 액션 처리 완료' })
  async bulkMemberAction(
    @Param('serverUrl') serverUrl: string,
    @Body() actionDto: {
      action: 'kick' | 'ban';
      userEmails: string[];
    },
    @CurrentUser() user: User
  ): Promise<{ processed: number; failed: Array<{ userEmail: string; reason: string }> }> {
    const adminUserPk = user.userPk;

    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);

    // 일괄 강퇴/밴 실행
    const result = await this.serverMemberManagementService.bulkMemberAction(
      server.serverPk,
      actionDto.action,
      actionDto.userEmails,
      adminUserPk
    );

    return {
      processed: result.processed,
      failed: result.failed
    };
  }

}