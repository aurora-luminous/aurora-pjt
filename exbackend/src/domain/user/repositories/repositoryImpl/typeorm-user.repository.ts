import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../user.repository';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async findByPk(userPk: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        userPk,
        isDeleted: false,
      },
    });
  }

  async findByEmail(userEmail: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        userEmail,
        isDeleted: false,
      },
    });
  }
}
