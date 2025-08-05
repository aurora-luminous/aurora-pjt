import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { getDatabaseConfig } from './database/database.config';
import { AppController } from './app.controller';

// 도메인 모듈들 import
import { UserManagementModule } from './domain/user_management/user-management.module';
import { AuthModule } from './domain/auth/auth.module';
import { WorkspaceManagementModule } from './domain/workspace_management/workspace-management.module';
import { MediaCommunicationModule } from './domain/media_communication/media-communication.module';
import { PermissionManagementModule } from './domain/permission_management/permission-management.module';

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

    // 도메인 모듈들
    UserManagementModule,
    AuthModule,
    WorkspaceManagementModule,
    MediaCommunicationModule,
    PermissionManagementModule,
  ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
