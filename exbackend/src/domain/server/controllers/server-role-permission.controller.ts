import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../user/entities/user.entity';
import { ServerRolePermissionService } from '../services/server-role-permission.service';
import {
  UpdateRolePermissionDto,
  ServerRolePermissionResponseDto,
  GetServerPermissionsResponseDto,
} from '../dto/server-role-permission.dto';

@ApiTags('server-permissions')
@Controller(':serverUrl/permissions')
export class ServerRolePermissionController {
  constructor(
    private readonly permissionService: ServerRolePermissionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '서버 역할별 권한 조회' })
  @ApiResponse({
    status: 200,
    description: '권한 조회 성공',
    type: GetServerPermissionsResponseDto,
  })
  async getServerPermissions(
    @Param('serverUrl') serverUrl: string,
    @CurrentUser() user: User,
  ): Promise<GetServerPermissionsResponseDto> {
    return this.permissionService.getServerPermissions(serverUrl, user.userPk);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '서버 역할 권한 업데이트 (소유자만 가능)' })
  @ApiResponse({
    status: 200,
    description: '권한 업데이트 성공',
    type: ServerRolePermissionResponseDto,
  })
  async updateRolePermission(
    @Param('serverUrl') serverUrl: string,
    @Body() updateDto: Omit<UpdateRolePermissionDto, 'serverPk'>,
    @CurrentUser() user: User,
  ): Promise<ServerRolePermissionResponseDto> {
    return this.permissionService.updateRolePermission(
      serverUrl,
      updateDto,
      user.userPk,
    );
  }
}
