import { Injectable } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { ProjectMemberService } from '../../project/services/project-member.service';
import { ChannelService } from 'src/domain/channel/services/channel.service';

@Injectable()
export class UserActivityServiceImpl implements UserActivityService {
  constructor(
    private readonly projectMemberService: ProjectMemberService,
    private readonly ChannelService: ChannelService
    ,
  ) {}

  async getLastConnectedChannel(userPk: number) {
    return await this.projectMemberService.getLastConnectedChannelInfo(
      userPk,
    );
  }

  async updateLastConnectedChannel(userPk: number, channelPk: number) {
    await this.projectMemberService.updateLastConnectedChannel(
      userPk,
      channelPk,
    );
  }

  async getAllChannelsForCurrentUser(userPk: number) {
    return await this.ChannelService.getAllChannelsForUser(userPk);
  }
}
