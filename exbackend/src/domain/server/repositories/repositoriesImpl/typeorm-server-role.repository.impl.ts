import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerRolePermission } from '../../entities/server-role-permission.entity';
import { ServerRoleRepository } from '../server-role.repository';

@Injectable()
export class TypeOrmServerRoleRepository extends ServerRoleRepository {
  constructor(
    @InjectRepository(ServerRolePermission)
    private readonly repository: Repository<ServerRolePermission>,
  ) {
    super();
  }

  async findOne(
    options: {
      permissionPk?: number;
      serverPk?: number;
      serverRole?: 'owner' | 'admin' | 'projectManager' | 'member';
    },
    relations?: string[]
  ): Promise<ServerRolePermission | null> {
    const { permissionPk, serverPk, serverRole } = options;
    return this.repository.findOne({
      where: {
        ...(permissionPk && { permissionPk }),
        ...(serverPk && { serverPk }),
        ...(serverRole && { serverRole }),
      },
      relations: relations || [],
    });
  }

  async findAll(
    options: { serverPk?: number },
    relations?: string[]
  ): Promise<ServerRolePermission[]> {
    const { serverPk } = options;
    return this.repository.find({
      where: {
        ...(serverPk && { serverPk }),
      },
      relations: relations || [],
    });
  }

  async save(permission: Partial<ServerRolePermission>): Promise<ServerRolePermission> {
    return this.repository.save(permission);
  }

  async saveMany(permissions: Partial<ServerRolePermission>[]): Promise<ServerRolePermission[]> {
    return this.repository.save(permissions);
  }

}
