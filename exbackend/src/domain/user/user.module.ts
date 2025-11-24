  import { Module } from '@nestjs/common';
  import { TypeOrmModule } from '@nestjs/typeorm';
  import { User } from './entities/user.entity';
  import { UserOption } from './entities/user-option.entity';
  import { UserService } from './services/user.service';
  import { UserController } from './controllers/user.controller';

  @Module({
    imports: [
      TypeOrmModule.forFeature([User, UserOption]),
    ],
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService],
  })
  export class UserModule {}