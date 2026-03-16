import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// JWT payload의 타입 정의
export interface JwtPayload {
  sub: string; // 사용자 이메일
  iat: number; // 발급 시간
  exp: number; // 만료 시간
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    super({
      // Authorization: Bearer <token>에서 토큰 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Spring과 동일한 시크릿 키 사용
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const userEmail = payload.sub;
    // 유저 이메일만 뽑아서 바로 반환
    return userEmail;
  }
}
