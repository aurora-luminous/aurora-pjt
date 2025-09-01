import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { ChannelCreationService } from './services/channel-creation.service';
import { ChannelInvitationService } from './services/channel-invitation.service';
import { ChannelController } from './controllers/channel.controller';

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
  ],
  providers: [
    ChannelCreationService,
    ChannelInvitationService,
  ],
  exports: [
    ChannelCreationService,
    ChannelInvitationService,
  ],
})
export class TextChannelModule {}