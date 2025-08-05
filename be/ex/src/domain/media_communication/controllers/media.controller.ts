import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaService } from '../services/media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // TODO: 미디어 커뮤니케이션 API 엔드포인트 구현 예정
}