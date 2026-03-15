import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// 엔티티, 컨트롤러, 서비스 임포트
import { User } from './entities/user.entity';
import { UserOption } from './entities/user-option.entity';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { TypeOrmUserRepository } from './repositories/implementations/typeorm-user.repository';

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

    // User 엔티티 import
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    UserService, // JWT Strategy에서 사용
    {
      provide: UserRepository,
      useClass: TypeOrmUserRepository,
    }
  ],
  exports: [JwtStrategy, UserService, UserRepository, JwtAuthGuard],
})
export class AuthModule {}