import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from '../config/snake-naming.strategy';
import { User } from '../domain/user/entities/user.entity';
import { UserOption } from '../domain/user/entities/user-option.entity';
import { Server } from '../domain/server/entities/server.entity';
import { ServerMember } from '../domain/server/entities/server-member.entity';
import { Project } from '../domain/project/entities/project.entity';
import { ProjectMember } from '../domain/project/entities/project-member.entity';
import { Channel } from '../domain/text-channel/entities/channel.entity';
import { ChannelMember } from '../domain/text-channel/entities/channel-member.entity';

export const getDatabaseConfig = (ConfigService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: ConfigService.get('DB_HOST'),
    port: ConfigService.get('DB_PORT'),
    username: ConfigService.get('DB_USERNAME'),
    password: ConfigService.get('DB_PASSWORD'),
    database: ConfigService.get('DB_DATABASE'),
    entities: [
        User,
        UserOption,
        Server,
        ServerMember,
        Project,
        ProjectMember,
        Channel,
        ChannelMember
    ],
    synchronize: ConfigService.get('NODE_ENV', 'development') === 'development',
    logging: ConfigService.get('NODE_ENV', 'development') === 'development',
    namingStrategy: new SnakeNamingStrategy(),
    
});