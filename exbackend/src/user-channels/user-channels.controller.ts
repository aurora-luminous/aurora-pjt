import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, User } from '../domain/auth';
import { ChannelCreationService } from '../domain/text-channel/services/channel-creation.service';
import { ChannelUserListDto } from '../domain/text-channel/dto/channel-user-list.dto';

@ApiTags('user-channels')
@Controller('my-channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserChannelsController {
  constructor(
    private readonly channelCreationService: ChannelCreationService,
  ) {}

  @Get()
  @ApiOperation({ summary: '현재 유저가 참가하고 있는 모든 채널 조회' })
  @ApiResponse({
    status: 200,
    description: '채널 목록 조회 성공',
    type: [ChannelUserListDto],
  })
  async getAllChannelsForCurrentUser(
    @CurrentUser() user: User,
  ): Promise<ChannelUserListDto[]> {
    return this.channelCreationService.getAllChannelsForUser(user.userPk);
  }
}
