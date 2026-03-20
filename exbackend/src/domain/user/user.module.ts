import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserOption } from './entities/user-option.entity';
import { UserService } from './services/user.service';
import { UserServiceImpl } from './services/serviceImpl/user.service.impl';
import { UserRepository } from './repositories/user.repository';
import { TypeOrmUserRepository } from './repositories/repositoryImpl/typeorm-user.repository'

// interceptor
 import { UserPopulationInterceptor } from './interceptors/user-population.interceptor';
 import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserOption]),
  ],
  controllers: [],
  providers: [
    {
      provide: UserService,
      useClass: UserServiceImpl,
    },
    {
      provide: UserRepository,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserPopulationInterceptor,
    }
  ],
  exports: [UserService], 
})
export class UserModule {}
