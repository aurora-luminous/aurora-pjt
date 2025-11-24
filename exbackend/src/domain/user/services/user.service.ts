import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        userEmail: email,
        isDeleted: false
      },
    });
  }

  async findByEmailOrThrow(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`이메일 ${email}을 가진 사용자를 찾을 수 없습니다`);
    }
    return user;
  }

  async findByPk(userPk: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        userPk,
        isDeleted: false
      },
    });
  }

  async findByPkOrThrow(userPk: number): Promise<User> {
    const user = await this.findByPk(userPk);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${userPk}를 찾을 수 없습니다`);
    }
    return user;
  }
}