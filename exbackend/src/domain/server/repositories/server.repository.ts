import { Server } from '../entities/server.entity';

export abstract class ServerRepository {
  abstract findOne(
    options: {
      serverPk?: number;
      serverUrl?: string;
      isDeletedServer?: boolean;
    },
    relations?: string[]
  ): Promise<Server | null>;

  abstract findAll(
    options: { isDeletedServer?: boolean },
    relations?: string[]
  ): Promise<Server[]>;

  abstract save(server: Partial<Server>): Promise<Server>;

  abstract delete(serverPk: number): Promise<void>;

}
