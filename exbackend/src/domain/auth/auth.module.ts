import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// 인증 관련
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    // Passport 설정
    PassportModule,

    // JWT 모듈 설정
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h', // 토큰 만료 시간
        },
      }),
    }),

  ],
  controllers: [],
  providers: [
    JwtAuthGuard,
    JwtStrategy,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}