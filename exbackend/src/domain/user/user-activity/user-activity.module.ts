import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ProjectModule } from '../../project/project.module';
import { TextChannelModule } from '../../channel/channel.module';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';
import { UserActivityServiceImpl } from './user-activity.service.impl';

@Module({
  imports: [AuthModule, ProjectModule, TextChannelModule],
  controllers: [UserActivityController],
  providers: [
    {
      provide: UserActivityService,
      useClass: UserActivityServiceImpl,
    },
  ],
})
export class UserActivityModule {}
