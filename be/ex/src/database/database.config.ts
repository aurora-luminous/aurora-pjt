import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from '../config/snake-naming.strategy';
import { join } from 'path';

export const getDatabaseConfig = (ConfigService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: ConfigService.get('DB_HOST'),
    port: ConfigService.get('DB_PORT'),
    username: ConfigService.get('DB_USERNAME'),
    password: ConfigService.get('DB_PASSWORD'),
    database: ConfigService.get('DB_DATABASE'),
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    synchronize: ConfigService.get('NODE_ENV', 'development') === 'development',
    logging: ConfigService.get('NODE_ENV', 'development') === 'development',
    namingStrategy: new SnakeNamingStrategy(),
    
});