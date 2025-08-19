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
    type: ChannelListDto,
  })
  async createChannel(
    @Param('serverUrl') serverUrl: string, // RouterModule에서 자동 제공
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body()
    createChannelDto: Omit<CreateChannelDto, 'projectPk' | 'creatorUserPk'>,
    @CurrentUser() user: User
  ): Promise<ChannelListDto> {
    const creatorUserPk = user.userPk;

    const channelDto: CreateChannelDto = {
      ...createChannelDto,
      projectPk: projectPk,
      creatorUserPk: creatorUserPk,
    };
    const result = await this.channelCreationService.createChannel(channelDto);
    return {
      channelName: result.channelName,
      channelKind: result.channelKind.toLowerCase() as 'text' | 'voice',
      isPrivate: result.isPrivate,
      channelRole: 'admin' as 'admin' | 'member', // 생성자는 항상 admin
    };
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
    const channels = await this.channelCreationService.getChannelsByProject(
      projectPk,
      requestUserPk,
      serverUrl,
    );
    return channels.map((channel) => ({
      channelName: channel.channelName,
      channelKind: channel.channelKind.toLowerCase() as 'text' | 'voice',
      isPrivate: channel.isPrivate,
      channelRole: 'member' as 'admin' | 'member', // 임시로 member로 설정
    }));
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
