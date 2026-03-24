import { Injectable } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { ProjectMemberUpdateService } from '../../project/services/project-member-update.service';
import { ChannelService } from 'src/domain/channel/services/channel.service';

@Injectable()
export class UserActivityServiceImpl implements UserActivityService {
  constructor(
    private readonly projectMemberUpdateService: ProjectMemberUpdateService,
    private readonly ChannelService: ChannelService
    ,
  ) {}

  async getLastConnectedChannel(userPk: number) {
    return await this.projectMemberUpdateService.getLastConnectedChannelInfo(
      userPk,
    );
  }

  async updateLastConnectedChannel(userPk: number, channelPk: number) {
    await this.projectMemberUpdateService.updateLastConnectedChannel(
      userPk,
      channelPk,
    );
  }

  async getAllChannelsForCurrentUser(userPk: number) {
    return await this.ChannelService.getAllChannelsForUser(userPk);
  }
}
