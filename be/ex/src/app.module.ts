import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RouterModule } from '@nestjs/core';
import { getDatabaseConfig } from './database/database.config';
import { AppController } from './app.controller';

// 도메인 모듈들 import
import { ServerModule } from './domain/server/server.module';
import { ProjectModule } from './domain/project/project.module';
import { TextChannelModule } from './domain/text-channel/text-channel.module';

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

    // Workspace 도메인 모듈들 (RouterModule으로 계층적 라우팅)
    ServerModule,
    ProjectModule,
    TextChannelModule,

    // Workspace 도메인 라우터 설정
    RouterModule.register([
      {
        path: 'servers',
        module: ServerModule,
      },
      {
        path: 'servers/:serverPk/projects',
        module: ProjectModule,
      },
      {
        path: 'servers/:serverPk/projects/:projectPk/channels',
        module: TextChannelModule,
      },
    ]),
  ],
  controllers: [
    AppController,
  ],
  providers: [],
})

export class AppModule {}
