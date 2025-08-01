import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { getDatabaseConfig } from './database/database.config';
import { AppController } from './app.controller';

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

  ],
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
