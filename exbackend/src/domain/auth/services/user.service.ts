import { User } from '../entities/user.entity';

export abstract class UserService {
  
  // 이메일로 유저 찾기
  abstract getUserByEmail(email: string): Promise<User>;
  
  // PK로 유저 찾기
  abstract getUserByPk(userPk: number): Promise<User>;
}
