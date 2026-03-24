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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth';
import { CurrentUser, User } from '../../user';
import { ChannelService } from '../services/channel.service';
import { ChannelMemberService } from '../services/channel-member.service';
import {
  CreateChannelDto,
  ChannelListDto,
  ChannelCreateDto,
  BulkInviteToChannelDto,
  ChannelMemberDto,
  UpdateChannelMemberRoleDto,
  UpdateChannelDto,
  RemoveFromChannelDto,
} from '../dto';

@ApiTags('channels')
@Controller('servers/:serverUrl/projects/:projectPk/channels')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly channelMemberService: ChannelMemberService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 생성' })
  async createChannel(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() createChannelDto: CreateChannelDto,
    @CurrentUser() user: User,
  ): Promise<ChannelCreateDto> {
    return await this.channelService.createChannel(
      createChannelDto,
      projectPk,
      user.userPk,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '해당 프로젝트의 유저별 채널 목록 조회' })
  async getChannelsByProject(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @CurrentUser() user: User,
  ): Promise<ChannelListDto[]> {
    return await this.channelService.getChannelsByProject(
      projectPk,
      user.userPk,
    );
  }

  // === 채널 멤버 관련 ===

  @Post(':channelPk/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널에 사용자들 초대' })
  async inviteUsersToChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Body() users: Array<{ userEmail: string }>,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const bulkInviteDto: BulkInviteToChannelDto = {
      users,
      channelPk,
      inviterUserPk: user.userPk,
    };
    return await this.channelMemberService.inviteUsersToChannel(bulkInviteDto);
  }

  @Get(':channelPk/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 멤버 목록 조회' })
  async getChannelMembers(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @CurrentUser() user: User,
  ): Promise<ChannelMemberDto[]> {
    return this.channelMemberService.getChannelMembers(channelPk, user.userPk);
  }

  @Patch(':channelPk/members/:targetUserPk/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널에서 사용자 제거 (강퇴)' })
  async removeUserFromChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Param('targetUserPk', ParseIntPipe) targetUserPk: number,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const removeDto: RemoveFromChannelDto = {
      channelPk,
      targetUserPk,
      adminUserPk: user.userPk,
    };
    await this.channelMemberService.removeUserFromChannel(removeDto);
    return { message: '사용자 제거 성공' };
  }

  @Patch(':channelPk/members/:targetUserPk/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 멤버 역할 변경' })
  async updateChannelMemberRole(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Param('targetUserPk', ParseIntPipe) targetUserPk: number,
    @Body() updateRoleDto: UpdateChannelMemberRoleDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.channelMemberService.updateMemberRole(
      channelPk,
      targetUserPk,
      updateRoleDto.newRole,
      user.userPk,
    );
  }

  @Patch(':channelPk/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 유저가 채널 나가기' })
  async leaveChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return await this.channelMemberService.leaveChannel(channelPk, user.userPk);
  }

  // === 채널 관리 ===

  @Patch(':channelPk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 삭제' })
  async deleteChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.channelService.deleteChannel(channelPk, user.userPk);
    return { message: '채널이 성공적으로 삭제되었습니다.' };
  }

  @Patch(':channelPk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '채널 이름 변경' })
  async updateChannel(
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @Body() updateChannelDto: UpdateChannelDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.channelService.updateChannel(
      projectPk,
      channelPk,
      updateChannelDto.channelName,
      user.userPk,
    );
    return { message: '채널이 성공적으로 업데이트 되었습니다.' };
  }
}

/**
 * sfu 서버에서 채널 검증하는 API
 */
@ApiTags('sfu-validation')
@Controller('sfu-validate')
export class ChannelInternalController {
  constructor(private readonly channelService: ChannelService) {}

  @Get('channel/:channelPk')
  @ApiOperation({ summary: 'SFU 서버에서 채널 유효성 검증 및 종류 반환' })
  async validateChannelForSfu(
    @Param('channelPk', ParseIntPipe) channelPk: number,
  ): Promise<{
    isValid: boolean;
    channelKind?: string;
  }> {
    return this.channelService.validateChannelKind(channelPk);
  }
}
