import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// crypto polyfill for @nestjs/typeorm (Alpine Linux 호환성)
const crypto = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto || crypto;
}

import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RouterModule } from '@nestjs/core';
import { getDatabaseConfig } from './database/database.config';
import { AppController } from './app.controller';

// 도메인 모듈들 import
import { ServerModule } from './domain/server/server.module';
import { ProjectModule } from './domain/project/project.module';
import { ChannelModule } from './domain/channel/channel.module';
import { AuthModule } from './domain/auth/auth.module';
import { UserModule } from './domain/user/user.module';
import { UserActivityModule } from './domain/user/user-activity/user-activity.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) =>
        getDatabaseConfig(ConfigService),
    }),

    // HTTP 클라이언트 (Spring 서버 연동용)
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // Workspace 도메인 모듈들
    ServerModule,
    ProjectModule,
    ChannelModule,
    AuthModule,
    UserModule,
    UserActivityModule,
    RedisModule,

    // Workspace 도메인 라우터 설정
    RouterModule.register([
      {
        path: 'servers',
        module: ServerModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
