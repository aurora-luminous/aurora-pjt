import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from '../config/snake-naming.strategy';
import { User } from '../domain/user/entities/user.entity';
import { UserOption } from '../domain/user/entities/user-option.entity';
import { Server } from '../domain/server/entities/server.entity';
import { ServerMember } from '../domain/server/entities/server-member.entity';
import { ServerRolePermission } from '../domain/server/entities/server-role-permission.entity';
import { Project } from '../domain/project/entities/project.entity';
import { ProjectMember } from '../domain/project/entities/project-member.entity';
import { Event } from '../domain/project/entities/event.entity';
import { Channel } from '../domain/channel/entities/channel.entity';
import { ChannelMember } from '../domain/channel/entities/channel-member.entity';

export const getDatabaseConfig = (
  ConfigService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: ConfigService.get('DB_HOST'),
  port: ConfigService.get('DB_PORT'),
  username: ConfigService.get('DB_USER') || ConfigService.get('DB_USERNAME'), // 도커용 우선, 로컬용 fallback
  password: ConfigService.get('DB_PASSWORD'),
  database: ConfigService.get('DB_NAME') || ConfigService.get('DB_DATABASE'), // 도커용 우선, 로컬용 fallback
  entities: [
    User,
    UserOption,
    Server,
    ServerMember,
    ServerRolePermission,
    Project,
    ProjectMember,
    Event,
    Channel,
    ChannelMember,
  ],
  synchronize: false,
  logging: ConfigService.get('NODE_ENV', 'development') === 'development',
  namingStrategy: new SnakeNamingStrategy(),
});
