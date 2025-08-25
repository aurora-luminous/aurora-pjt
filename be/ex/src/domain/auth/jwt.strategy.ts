import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/services/user.service';
import { User } from '../user/entities/user.entity';

// JWT payload의 타입 정의
export interface JwtPayload {
sub: string;  // 사용자 이메일
iat: number;  // 발급 시간
exp: number;  // 만료 시간
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {
        super({
        // Authorization: Bearer <token>에서 토큰 추출
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        // Spring과 동일한 시크릿 키 사용
        secretOrKey: configService.get<string>('JWT_SECRET')!,
        });
    }

    // 토큰 검증 후 호출되는 메서드
    async validate(payload: JwtPayload): Promise<User> {
        const userEmail = payload.sub;

        // 이메일로 사용자 조회 
        const user = await this.userService.findByEmail(userEmail);

        if (!user || user.isDeleted) {
        throw new UnauthorizedException('Invalid user');
        }

        return user; // 이게 @CurrentUser()로 전달됨
    }
}