import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChannelValidationService } from '../../domain/text-channel/services/channel-validation.service';

@ApiTags('sfu-validation') // Updated ApiTags
@Controller('sfu-validate') // Updated base path
export class SfuValidationController { // Renamed class
  constructor(private readonly channelValidationService: ChannelValidationService) {}

  @Get('channel/:channelPk')
  @ApiOperation({ summary: 'SFU 서버에서 채널 유효성 검증 및 종류 반환' })
  @ApiResponse({ status: 200, description: '채널 유효성 및 종류 반환 성공' })
  async validateChannelForSfu(
    @Param('channelPk', ParseIntPipe) channelPk: number,
  ): Promise<{ isValid: boolean; channelKind?: 'TEXT' | 'VOICE' | 'NOTIFICATION' }> {
    return this.channelValidationService.validateChannelKind(channelPk);
  }
}
