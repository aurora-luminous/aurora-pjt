import { User } from '../entities/user.entity';

export abstract class UserRepository {
  abstract findByPk(userPk: number): Promise<User | null>;
  abstract findByEmail(userEmail: string): Promise<User | null>;

}
