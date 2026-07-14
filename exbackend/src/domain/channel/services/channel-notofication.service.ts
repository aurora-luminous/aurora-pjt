import { ChannelMemberNotificationDto, ChannelNotificationDto } from '../dto';

export abstract class ChannelNotificationService {

  // 멤버 관련 알림
  abstract notifyMemberAdded(channelPks: number[], userEmail: string, userName: string, profileImagePath: string): Promise<void>;
  abstract notifyMemberRemoved(channelPks: number[], userEmail: string, userName: string, profileImagePath: string): Promise<void>;
  abstract notifyMemberUpdated(channelPks: number[], userEmail: string, userName: string, profileImagePath: string): Promise<void>;

  // 채널 관련 알림
  abstract notifyChannelAdded(channelPk: number, channelName: string, projectPk: number): Promise<void>;
  abstract notifyChannelRemoved(channelPk: number, channelName: string, projectPk: number): Promise<void>;
  abstract notifyChannelUpdated(channelPk: number, channelName: string, projectPk: number): Promise<void>;
}