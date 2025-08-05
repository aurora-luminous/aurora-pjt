import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionService } from '../services/permission.service';

@ApiTags('Permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // TODO: 권한 관리 API 엔드포인트 구현 예정
}