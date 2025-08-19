import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../user/services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';

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
providers: [
    JwtStrategy,
    UserService, // JWT Strategy에서 사용
],
exports: [
    JwtStrategy,
    UserService,
],
})
export class AuthModule {}