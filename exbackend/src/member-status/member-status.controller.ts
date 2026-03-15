import {
  Controller,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, User } from '../domain/auth';
import { ProjectMemberUpdateService } from '../domain/project/services/project-member-update.service';
import { LastChannelInfoDto } from './dto/last-channel-info.dto';

@ApiTags('members')
@Controller('members')
export class MemberStatusController {
  constructor(
    private readonly projectMemberUpdateService: ProjectMemberUpdateService,
  ) {}

  @Get('me/last-channel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 유저의 마지막 접속 채널 정보 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '마지막 접속 채널 정보 조회 성공',
    type: LastChannelInfoDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '마지막 접속 채널 정보를 찾을 수 없음',
  })
  async getLastConnectedChannel(
    @CurrentUser() user: User,
  ): Promise<LastChannelInfoDto | null> {
    const lastChannelInfo =
      await this.projectMemberUpdateService.getLastConnectedChannelInfo(
        user.userPk,
      );
    if (!lastChannelInfo) {
      throw new NotFoundException('마지막 접속 채널 정보를 찾을 수 없습니다.');
    }
    return lastChannelInfo;
  }

  @Patch('me/last-channel/:channelPk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '프로젝트 멤버의 마지막 접속 채널 갱신' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '마지막 접속 채널 갱신 성공',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '채널 또는 프로젝트 멤버를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '마지막 채널 갱신에 실패했습니다.',
  })
  async updateLastConnectedChannel(
    @Param('channelPk', ParseIntPipe) channelPk: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.projectMemberUpdateService.updateLastConnectedChannel(
      user.userPk,
      channelPk,
    );
  }
}
