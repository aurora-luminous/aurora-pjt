export type ChannelEventType = 'CHANNEL_ADDED' | 'CHANNEL_REMOVED' | 'CHANNEL_UPDATED';

export interface ChannelNotificationDto {
  eventType: ChannelEventType;
  channelPk: number;
  channelName: string;
  projectPk: number;
}
