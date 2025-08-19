import { Controller, Post, Get, Body, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServerCreationService } from '../services/server-creation.service';
import { ServerInvitationService } from '../services/server-invitation.service';
import { CreateServerDto, ServerListDto, ServerCreateResponseDto } from '../dto';

@ApiTags('servers')
@Controller()
export class ServerController {
  constructor(
    private readonly serverCreationService: ServerCreationService,
    private readonly serverInvitationService: ServerInvitationService,
  ) {}

  @Post()
  @ApiOperation({ summary: '서버 생성' })
  @ApiResponse({ status: 201, description: '서버 생성 성공' })
  async createServer(
    @Body() createServerDto: Omit<CreateServerDto, 'creatorUserPk'>
  ): Promise<ServerCreateResponseDto> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
    const creatorUserPk = 1; // 임시 하드코딩

    const completeServerDto: CreateServerDto = {
      ...createServerDto,
      creatorUserPk: creatorUserPk
    };
    await this.serverCreationService.createServer(completeServerDto);
    return { message: "생성 완료" };
  }

  @Get()
  @ApiOperation({ summary: '유저가 속한 서버 목록 조회' })
  @ApiResponse({ status: 200, description: '서버 목록 조회 성공', type: [ServerListDto] })
  async getUserServers(): Promise<ServerListDto[]> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const requestUserPk = 1; // 임시 하드코딩
    
    const servers = await this.serverCreationService.getUserServers(requestUserPk);
    return servers.map(server => ({
      serverUrl: server.serverUrl,
      serverName: server.serverName
    }));
  }

  @Post(':serverUrl/invite')
  @ApiOperation({ summary: '서버 초대 링크 생성' })
  @ApiResponse({ status: 201, description: '초대 링크 생성 성공' })
  async generateServerInviteLink(
    @Param('serverUrl') serverUrl: string
  ): Promise<{ inviteLink: string }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const requestUserPk = 1; // 임시 하드코딩
    
    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);
    const result = await this.serverInvitationService.generateInviteLink(server.serverPk, requestUserPk);
    return { inviteLink: result.inviteLink };
  }

  @Get(':serverUrl/join/:inviteHash')
  @ApiOperation({ summary: '서버 가입 신청' })
  @ApiResponse({ status: 200, description: '가입 신청 성공' })
  async joinServer(
    @Param('serverUrl') serverUrl: string,
    @Param('inviteHash') inviteHash: string
  ): Promise<{ status: 'Pending' | 'Approved' | 'Rejected' }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const userPk = 1; // 임시 하드코딩
    
    const result = await this.serverInvitationService.joinServerByInvite({
      inviteHash,
      userPk
    });
    return { status: result.status as 'Pending' | 'Approved' | 'Rejected' };
  }

  @Get(':serverUrl/pending')
  @ApiOperation({ summary: '서버 가입 대기 목록' })
  @ApiResponse({ status: 200, description: '대기 목록 조회 성공' })
  async getPendingMembers(
    @Param('serverUrl') serverUrl: string
  ): Promise<Array<{
    status: string;
    userInfo: {
      user_name: string;
      user_email: string;
      profile_image_path: string;
    };
  }>> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const requestUserPk = 1; // 임시 하드코딩
    
    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);
    const members = await this.serverInvitationService.getPendingMembers(server.serverPk, requestUserPk);
    
    // 명세서 형식에 맞게 변환
    return members.map(member => ({
      status: member.status,
      userInfo: {
        user_name: member.userInfo.user_name,
        user_email: member.userInfo.user_email,
        profile_image_path: member.userInfo.profile_image_path
      }
    }));
  }

  @Patch(':serverUrl/members')
  @ApiOperation({ summary: '서버 멤버 승인/거절/밴' })
  @ApiResponse({ status: 200, description: '멤버 상태 변경 성공' })
  async updateMemberStatus(
    @Param('serverUrl') serverUrl: string,
    @Body() updateDto: { 
      userEmail: string;
      status: 'Approved' | 'Rejected' | 'Banned';
    }
  ): Promise<{
    status: 'Approved' | 'Rejected' | 'Banned';
    userInfo: {
      user_name: string;
      user_email: string;
      profile_image_path: string;
    };
  }> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    const adminUserPk = 1; // 임시 하드코딩
    
    // serverUrl로 serverPk 조회
    const server = await this.serverCreationService.getServerByUrl(serverUrl);
    
    const result = await this.serverInvitationService.updateMemberStatusByEmail(
      server.serverPk,
      updateDto.userEmail,
      updateDto.status,
      adminUserPk
    );
    
    // 명세서 형식에 맞게 변환
    return {
      status: result.status as 'Approved' | 'Rejected' | 'Banned',
      userInfo: {
        user_name: result.userInfo.user_name,
        user_email: result.userInfo.user_email,
        profile_image_path: result.userInfo.profile_image_path
      }
    };
  }

}