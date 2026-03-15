import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        `이메일 ${email}을 가진 사용자를 찾을 수 없습니다`,
      );
    }
    return user;
  }

  async getUserByPk(userPk: number): Promise<User> {
    const user = await this.userRepository.findByPk(userPk);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${userPk}를 찾을 수 없습니다`);
    }
    return user;
  }
}
