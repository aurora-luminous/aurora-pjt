import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber } from 'class-validator';

export class PermissionsDto {
  @ApiProperty({ description: '멤버 킥 권한' })
  @IsBoolean()
  kickMembers: boolean;

  @ApiProperty({ description: '멤버 밴 권한' })
  @IsBoolean()
  banMembers: boolean;

  @ApiProperty({ description: '역할 관리 권한' })
  @IsBoolean()
  manageRoles: boolean;
}

export class UpdateRolePermissionDto {
  @ApiProperty({ description: '서버 기본키' })
  @IsNumber()
  serverPk: number;

  @ApiProperty({
    description: '서버 역할',
    enum: ['owner', 'admin', 'projectManager', 'member']
  })
  @IsEnum(['owner', 'admin', 'projectManager', 'member'])
  serverRole: 'owner' | 'admin' | 'projectManager' | 'member';

  @ApiProperty({ description: '권한 설정', type: PermissionsDto })
  permissions: PermissionsDto;
}

export class ServerRolePermissionResponseDto {
  @ApiProperty({ description: '권한 기본키' })
  permissionPk: number;

  @ApiProperty({ description: '서버 기본키' })
  serverPk: number;

  @ApiProperty({
    description: '서버 역할',
    enum: ['owner', 'admin', 'projectManager', 'member']
  })
  serverRole: 'owner' | 'admin' | 'projectManager' | 'member';

  @ApiProperty({ description: '멤버 킥 권한' })
  kickMembers: boolean;

  @ApiProperty({ description: '멤버 밴 권한' })
  banMembers: boolean;

  @ApiProperty({ description: '역할 관리 권한' })
  manageRoles: boolean;
}

export class GetServerPermissionsResponseDto {
  @ApiProperty({
    description: '서버별 역할 권한 목록',
    type: [ServerRolePermissionResponseDto]
  })
  rolePermissions: ServerRolePermissionResponseDto[];
}