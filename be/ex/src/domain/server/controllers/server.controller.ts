import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServerCreationService } from '../services/server-creation.service';
import { CreateServerDto, ServerResponseDto } from '../dto';

@ApiTags('servers')
@Controller()
export class ServerController {
  constructor(
    private readonly serverCreationService: ServerCreationService,
  ) {}

  @Post()
  @ApiOperation({ summary: '서버 생성' })
  @ApiResponse({ status: 201, description: '서버 생성 성공' })
  async createServer(
    @Body() createServerDto: Omit<CreateServerDto, 'creatorUserPk'>
  ): Promise<ServerResponseDto> {
    // TODO: JWT에서 사용자 정보 추출하도록 수정 필요
    // @CurrentUser() user: User
    const creatorUserPk = 1; // 임시 하드코딩

    const completeServerDto: CreateServerDto = {
      ...createServerDto,
      creatorUserPk: creatorUserPk
    };
    return this.serverCreationService.createServer(completeServerDto);
  }

  @Get()
  @ApiOperation({ summary: '전체 서버 목록 조회' })
  @ApiResponse({ status: 200, description: '서버 목록 조회 성공' })
  async getAllServers(): Promise<ServerResponseDto[]> {
    return this.serverCreationService.getAllServers();
  }

  @Get(':serverPk')
  @ApiOperation({ summary: '서버 상세 조회' })
  @ApiResponse({ status: 200, description: '서버 조회 성공' })
  async getServerById(@Param('serverPk', ParseIntPipe) serverPk: number): Promise<ServerResponseDto> {
    return this.serverCreationService.getServerById(serverPk);
  }
}