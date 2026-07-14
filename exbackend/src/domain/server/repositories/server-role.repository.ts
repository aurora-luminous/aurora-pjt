import { ServerRolePermission } from '../entities/server-role-permission.entity';

export abstract class ServerRoleRepository {
  abstract findOne(
    options: {
      permissionPk?: number;
      serverPk?: number;
      serverRole?: 'owner' | 'admin' | 'projectManager' | 'member';
    },
    relations?: string[]
  ): Promise<ServerRolePermission | null>;

  abstract findAll(
    options: { serverPk?: number },
    relations?: string[]
  ): Promise<ServerRolePermission[]>;

  abstract save(permission: Partial<ServerRolePermission>): Promise<ServerRolePermission>;

  abstract saveMany(permissions: Partial<ServerRolePermission>[]): Promise<ServerRolePermission[]>;

}
