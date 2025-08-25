import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: '서버 상태 확인' })
  getHello(): object {
    return {
      message: 'Messenger Structure API Server is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('health')
  @ApiOperation({ summary: '헬스체크' })
  healthCheck(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
