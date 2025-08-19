import { Controller, Post, Get, Body, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServerCreationService } from '../services/server-creation.service';
import { ServerInvitationService } from '../services/server-invitation.service';
import { CreateServerDto, ServerListDto, ServerCreateResponseDto } from '../dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../user/entities/user.entity';

@ApiTags('servers')
@Controller()
export class ServerController {
  constructor(
    private readonly serverCreationService: ServerCreationService,
    private readonly serverInvitationService: ServerInvitationService,
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
    
    const servers = await this.serverCreationService.getUserServers(requestUserPk);
    return servers.map(server => ({
      serverUrl: server.serverUrl,
      serverName: server.serverName
    }));
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
  @ApiOperation({ summary: '서버 가입 신청' })
  @ApiResponse({ status: 200, description: '가입 신청 성공' })
  async joinServer(
    @Param('serverUrl') serverUrl: string,
    @Param('inviteHash') inviteHash: string,
    @CurrentUser() user: User
  ): Promise<{ status: 'Pending' | 'Approved' | 'Rejected' }> {
    const userPk = user.userPk;
    
    const result = await this.serverInvitationService.joinServerByInvite({
      inviteHash,
      userPk
    });
    return { status: result.sStatus as 'Pending' | 'Approved' | 'Rejected' };
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
    status: string;
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
      status: member.sStatus,
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
      status: 'Approved' | 'Rejected' | 'Banned';
    },
    @CurrentUser() user: User
  ): Promise<{
    status: 'Approved' | 'Rejected' | 'Banned';
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
      updateDto.status,
      adminUserPk
    );
    
    // 명세서 형식에 맞게 변환
    return {
      status: result.sStatus as 'Approved' | 'Rejected' | 'Banned',
      userInfo: {
        user_name: result.userInfo.user_name,
        user_email: result.userInfo.user_email,
        profile_image_path: result.userInfo.profile_image_path
      }
    };
  }

}