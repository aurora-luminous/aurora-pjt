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
import { ChannelCreationService } from '../services/channel-creation.service';
import { ChannelInvitationService } from '../services/channel-invitation.service';
import {
  CreateChannelDto,
  ChannelListDto,
  ChannelCreateDto,
  BulkInviteToChannelDto,
  ChannelMemberDto,
  ManageMemberDto,
} from '../dto';

@ApiTags('channels')
@Controller()
export class ChannelController {
  constructor(
    private readonly channelCreationService: ChannelCreationService,
    private readonly channelInvitationService: ChannelInvitationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 생성' })
  @ApiResponse({
    status: 201,
    description: '채널 생성 성공',
    type: ChannelCreateDto,
  })
  async createChannel(
    @Param('serverUrl') serverUrl: string, // RouterModule에서 자동 제공
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body()
    // "프론트엔드에서 전송한 데이터"와 "인증 컨텍스트의 데이터"를 명시적으로 분리
    createChannelDto: CreateChannelDto, // creatorUserPk를 Body에서 제외
    @CurrentUser() user: User
  ): Promise<ChannelCreateDto> {
    const creatorUserPk = user.userPk;

    return await this.channelCreationService.createChannel(createChannelDto, projectPk, creatorUserPk);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '해당 프로젝트의 유저별 채널 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '채널 목록 조회 성공',
    type: [ChannelListDto],
  })
  async getChannelsByProject(
    @Param('serverUrl') serverUrl: string, // RouterModule에서 자동 제공
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @CurrentUser() user: User
  ): Promise<ChannelListDto[]> {
    const requestUserPk = user.userPk;
    // 서버와 프로젝트 컴텍스트 정보 전달
    return await this.channelCreationService.getChannelsByProject(
      projectPk,
      requestUserPk,
      serverUrl,
    );
  }

  // === 채널 초대 관련 엔드포인트 ===

  @Post(':channelPk/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Private 채널에 사용자들 초대' })
  @ApiResponse({ status: 201, description: '초대 성공' })
  async inviteUsersToChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Body() users: Array<{ userEmail: string }>,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const inviterUserPk = user.userPk;

    const bulkInviteDto: BulkInviteToChannelDto = {
      users: users,
      channelPk: channelPk,
      inviterUserPk: inviterUserPk,
    };

    await this.channelInvitationService.bulkInviteUsersToChannel(bulkInviteDto);
    return { message: '초대 완료' };
  }

  @Get(':channelPk/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 멤버 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '멤버 목록 조회 성공',
    type: [ChannelMemberDto],
  })
  async getChannelMembers(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @CurrentUser() user: User
  ): Promise<ChannelMemberDto[]> {
    const requestUserPk = user.userPk;

    return this.channelInvitationService.getChannelMembers(
      channelPk,
      requestUserPk,
    );
  }

  @Patch(':channelPk/members/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널에서 사용자 제거/퇴장' })
  @ApiResponse({ status: 200, description: '사용자 제거 성공' })
  async removeUserFromChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const adminUserPk = user.userPk;

    await this.channelInvitationService.removeUserFromChannelByEmail(
      channelPk,
      manageMemberDto.userEmail,
      adminUserPk,
    );
    return { message: "사용자 퇴장 성공" };
  }

  @Patch(':channelPk/members/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널에서 사용자 차단' })
  @ApiResponse({ status: 200, description: '사용자 차단 성공' })
  async banUserFromChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const adminUserPk = user.userPk;

    return this.channelInvitationService.banUserFromChannelByEmail(
      channelPk,
      manageMemberDto.userEmail,
      adminUserPk,
    );
  }

  @Patch(':channelPk/members/unban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널에서 사용자 차단 해제' })
  @ApiResponse({ status: 200, description: '차단 해제 성공' })
  async unbanUserFromChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Body() manageMemberDto: ManageMemberDto,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    const ownerUserPk = user.userPk;

    await this.channelInvitationService.unbanUserFromChannelByEmail(
      channelPk,
      manageMemberDto.userEmail,
      ownerUserPk,
    );
    return { message: '차단 해제 성공' };
  }
}
