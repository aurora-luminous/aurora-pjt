import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelCreationService } from '../services/channel-creation.service';
import { CreateChannelDto, ChannelResponseDto } from '../dto';

@ApiTags('channels')
@Controller()
export class ChannelController {
  constructor(
    private readonly channelCreationService: ChannelCreationService,
  ) {}

  @Post()
  @ApiOperation({ summary: '채널 생성' })
  @ApiResponse({ status: 201, description: '채널 생성 성공' })
  async createChannel(
    @Param('serverPk', ParseIntPipe) serverPk: number, // RouterModule에서 자동 제공
    @Param('projectPk', ParseIntPipe) projectPk: number,
    @Body() createChannelDto: Omit<CreateChannelDto, 'projectPk' | 'creatorUserPk'>
  ): Promise<ChannelResponseDto> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
    const creatorUserPk = 1; // 임시 하드코딩

    const channelDto: CreateChannelDto = {
      ...createChannelDto,
      projectPk: projectPk,
      creatorUserPk: creatorUserPk
    };
    return this.channelCreationService.createChannel(channelDto);
  }

  @Get()
  @ApiOperation({ summary: '프로젝트별 채널 목록 조회 (권한별 필터링)' })
  @ApiResponse({ status: 200, description: '채널 목록 조회 성공' })
  async getChannelsByProject(
    @Param('serverPk', ParseIntPipe) serverPk: number, // RouterModule에서 자동 제공
    @Param('projectPk', ParseIntPipe) projectPk: number,
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
  ): Promise<ChannelResponseDto[]> {
    // 임시로 하드코딩 (추후 JWT 인증으로 변경)
    const requestUserPk = 1;
    // 서버와 프로젝트 컴텍스트 정보 전달
    return this.channelCreationService.getChannelsByProject(projectPk, requestUserPk, serverPk);
  }

  @Get(':channelPk')
  @ApiOperation({ summary: '채널 상세 조회' })
  @ApiResponse({ status: 200, description: '채널 조회 성공' })
  async getChannelById(
    @Param('serverPk', ParseIntPipe) serverPk: number, // RouterModule에서 자동 제공
    @Param('projectPk', ParseIntPipe) projectPk: number, // RouterModule에서 자동 제공
    @Param('channelPk', ParseIntPipe) channelPk: number
  ): Promise<ChannelResponseDto> {
    // 전체 경로 컴텍스트 정보 전달
    return this.channelCreationService.getChannelById(channelPk, projectPk, serverPk);
  }
}