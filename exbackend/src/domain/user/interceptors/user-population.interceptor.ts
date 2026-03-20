import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';

@Injectable()
export class UserPopulationInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userEmail = request.user; // JwtStrategy가 반환한 이메일 문자열

    // 만약 request.user가 이미 객체이거나 이메일이 없다면 통과
    if (typeof userEmail === 'string') {
      
      try {
        const user = await this.userService.getUserByEmail(userEmail);
        if (user) {
          request.user = user;
        }
      } catch (error) {
        console.error(`[UserPopulationInterceptor] Failed to fetch user: ${error.message}`);
      }
    }

    return next.handle();
  }
}