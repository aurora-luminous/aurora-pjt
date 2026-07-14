import {
  UpdateRolePermissionDto,
  ServerRolePermissionResponseDto,
  GetServerPermissionsResponseDto,
} from '../dto/server-role-permission.dto';

export abstract class ServerRolePermissionService {
  abstract getServerPermissions(serverUrl: string, requestUserPk: number): Promise<GetServerPermissionsResponseDto>;
  abstract updateRolePermission(
    serverUrl: string,
    updateDto: Omit<UpdateRolePermissionDto, 'serverPk'>,
    requestUserPk: number,
  ): Promise<ServerRolePermissionResponseDto>;
  abstract hasPermission(
    serverPk: number,
    userPk: number,
    permission: 'kickMembers' | 'banMembers' | 'manageRoles',
  ): Promise<boolean>;
  abstract createDefaultPermissions(serverPk: number): Promise<void>;
}
