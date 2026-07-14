import {
  Controller,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserActivityService } from './user-activity.service';


@ApiTags('user-activity')
@Controller()
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Get('members/me/last-channel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 유저의 마지막 접속 채널 정보 조회' })
  async getLastConnectedChannel(@CurrentUser() user: User) {
    return await this.userActivityService.getLastConnectedChannel(user.userPk);
  }

  @Patch('members/me/last-channel/:channelPk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '프로젝트 멤버의 마지막 접속 채널 갱신' })
  async updateLastConnectedChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @CurrentUser() user: User,
  ) {
    await this.userActivityService.updateLastConnectedChannel(user.userPk, channelPk);
  }

  @Get('my-channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 유저가 참가하고 있는 모든 채널 조회' })
  async getAllChannelsForCurrentUser(@CurrentUser() user: User) {
    return await this.userActivityService.getAllChannelsForCurrentUser(user.userPk);
  }
}