import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete,
  Body, 
  Param, 
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { 
  ServerInvitationService,
  JoinServerDto,
  ServerInviteDto,
  PendingMemberDto,
  UpdateMemberStatusDto
} from '../services/server-invitation.service';

@ApiTags('workspace-management')
@Controller('servers')
export class ServerInvitationController {
  constructor(private readonly serverInvitationService: ServerInvitationService) {}

  @Post(':serverPk/invite-link')
  @ApiOperation({ summary: '서버 초대 링크 생성' })
  @ApiResponse({ status: 201, description: '초대 링크 생성 성공' })
  async generateInviteLink(
    @Param('serverPk', ParseIntPipe) serverPk: number,
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
  ): Promise<ServerInviteDto> {
    const requestUserPk = 1; // 임시값
    return this.serverInvitationService.generateInviteLink(serverPk, requestUserPk);
  }

  @Post('join/:inviteHash')
  @ApiOperation({ summary: '초대 링크로 서버 가입 신청' })
  @ApiResponse({ status: 201, description: '서버 가입 신청 성공' })
  async joinServerByInvite(
    @Param('inviteHash') inviteHash: string,
    @Body() body: { userPk: number } // 임시로 body에서 받기, 추후 JWT로 변경
  ): Promise<PendingMemberDto> {
    return this.serverInvitationService.joinServerByInvite({
      inviteHash,
      userPk: body.userPk,
    });
  }

  @Get(':serverPk/pending-members')
  @ApiOperation({ summary: '서버 승인 대기 목록 조회' })
  @ApiResponse({ status: 200, description: '대기 목록 조회 성공' })
  async getPendingMembers(
    @Param('serverPk', ParseIntPipe) serverPk: number,
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
  ): Promise<PendingMemberDto[]> {
    const requestUserPk = 1; // 임시값
    return this.serverInvitationService.getPendingMembers(serverPk, requestUserPk);
  }

  @Patch('members/:serverMemberPk/status')
  @ApiOperation({ summary: '서버 가입 승인/거절' })
  @ApiResponse({ status: 200, description: '멤버 상태 업데이트 성공' })
  async updateMemberStatus(
    @Param('serverMemberPk', ParseIntPipe) serverMemberPk: number,
    @Body() updateDto: Omit<UpdateMemberStatusDto, 'adminUserPk'>
  ): Promise<PendingMemberDto> {
    const adminUserPk = 1; // 임시값, JWT에서 추출 필요
    return this.serverInvitationService.updateMemberStatus(serverMemberPk, {
      ...updateDto,
      adminUserPk,
    });
  }

  @Patch(':serverPk/members/:targetUserPk/ban')
  @ApiOperation({ summary: '서버에서 멤버 밴 (상태 변경)' })
  @ApiResponse({ status: 200, description: '멤버 밴 성공' })
  async banMember(
    @Param('serverPk', ParseIntPipe) serverPk: number,
    @Param('targetUserPk', ParseIntPipe) targetUserPk: number,
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
  ): Promise<void> {
    const adminUserPk = 1; // 임시값
    return this.serverInvitationService.banMember(serverPk, targetUserPk, adminUserPk);
  }

  @Get(':serverPk/members')
  @ApiOperation({ summary: '서버 활성 멤버 목록 조회' })
  @ApiResponse({ status: 200, description: '활성 멤버 목록 조회 성공' })
  async getActiveServerMembers(
    @Param('serverPk', ParseIntPipe) serverPk: number,
  ): Promise<PendingMemberDto[]> {
    const requestUserPk = 1; // 임시값
    return this.serverInvitationService.getActiveServerMembers(serverPk, requestUserPk);
  }

  @Get(':serverPk/banned-members')
  @ApiOperation({ summary: '서버 밴된 멤버 목록 조회 (관리자만)' })
  @ApiResponse({ status: 200, description: '밴된 멤버 목록 조회 성공' })
  async getBannedMembers(
    @Param('serverPk', ParseIntPipe) serverPk: number,
  ): Promise<PendingMemberDto[]> {
    const requestUserPk = 1; // 임시값
    return this.serverInvitationService.getBannedMembers(serverPk, requestUserPk);
  }

  @Patch('members/:serverMemberPk/unban')
  @ApiOperation({ summary: '밴된 멤버 복구 (Owner만)' })
  @ApiResponse({ status: 200, description: '멤버 언밴 성공' })
  async unbanMember(
    @Param('serverMemberPk', ParseIntPipe) serverMemberPk: number,
  ): Promise<PendingMemberDto> {
    const adminUserPk = 1; // 임시값
    return this.serverInvitationService.unbanMember(serverMemberPk, adminUserPk);
  }
}