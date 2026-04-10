import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../entities/server.entity';
import { ServerRepository } from '../server.repository';

@Injectable()
export class TypeOrmServerRepository extends ServerRepository {
  constructor(
    @InjectRepository(Server)
    private readonly repository: Repository<Server>,
  ) {
    super();
  }

  async findOne(
    options: { serverPk?: number; serverUrl?: string; isDeletedServer?: boolean },
    relations?: string[]
  ): Promise<Server | null> {
    const { serverPk, serverUrl, isDeletedServer } = options;
    return this.repository.findOne({
      where: {
        ...(serverPk && { serverPk }),
        ...(serverUrl && { serverUrl }),
        isDeletedServer: isDeletedServer !== undefined ? isDeletedServer : false,
      },
      relations: relations || [],
    });
  }

  async findAll(
    options: { isDeletedServer?: boolean },
    relations?: string[]
  ): Promise<Server[]> {
    const { isDeletedServer } = options;
    return this.repository.find({
      where: {
        isDeletedServer: isDeletedServer !== undefined ? isDeletedServer : false,
      },
      relations: relations || [],
    });
  }

  async save(server: Partial<Server>): Promise<Server> {
    return this.repository.save(server);
  }

  async delete(serverPk: number): Promise<void> {
    await this.repository.update(serverPk, { isDeletedServer: true });
  }

}
