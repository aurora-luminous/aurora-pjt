import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { ChannelService } from './services/channel.service';
import { ChannelServiceImpl } from './services/servicesImpl/channel.service.impl';
import { ChannelMemberService } from './services/channel-member.service';
import { ChannelMemberServiceImpl } from './services/servicesImpl/channel-member.service.impl';
import { ChannelNotificationService } from './services/channel-notofication.service';
import { ChannelNotificationServiceImpl } from './services/servicesImpl/channel-notification.service.impl';
import { ChannelController, ChannelInternalController } from './controllers/channel.controller';
import { ChannelRepository } from './repositories/channel.repository';
import { ChannelMemberRepository } from './repositories/channel-member.repository';
import { TypeOrmChannelRepository } from './repositories/repositoryImpl/typeorm-channel.repository';
import { TypeOrmChannelMemberRepository } from './repositories/repositoryImpl/typeorm-channel-member.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channel,
      ChannelMember,
      Project,
      ProjectMember,
      User,
    ]),
    UserModule,
  ],
  controllers: [
    ChannelController,
    ChannelInternalController,
  ],
  providers: [
    {
      provide: ChannelRepository,
      useClass: TypeOrmChannelRepository
    },
    {
      provide: ChannelMemberRepository,
      useClass: TypeOrmChannelMemberRepository
    },
    {
      provide: ChannelService,
      useClass: ChannelServiceImpl
    },
    {
      provide: ChannelMemberService,
      useClass: ChannelMemberServiceImpl
    },
    {
      provide: ChannelNotificationService,
      useClass: ChannelNotificationServiceImpl
    },
  ],
  exports: [
    ChannelService,
    ChannelMemberService,
    ChannelNotificationService,
  ],
})
export class ChannelModule {}