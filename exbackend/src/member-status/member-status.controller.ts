import {
  Controller,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../domain/auth/jwt-auth.guard';
import { CurrentUser } from '../domain/auth/current-user.decorator';
import { User } from '../domain/user/entities/user.entity';
import { ProjectMemberUpdateService } from '../domain/project/services/project-member-update.service';

@ApiTags('members')
@Controller('members/me/last-channel')
export class MemberStatusController {
  constructor(
    private readonly projectMemberUpdateService: ProjectMemberUpdateService,
  ) {}

  @Patch(':channelPk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '프로젝트 멤버의 마지막 접속 채널 갱신' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '마지막 접속 채널 갱신 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '채널 또는 프로젝트 멤버를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '마지막 채널 갱신에 실패했습니다.' })
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
