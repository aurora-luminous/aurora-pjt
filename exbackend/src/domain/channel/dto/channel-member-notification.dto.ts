import { IsNumber, IsString, IsArray } from 'class-validator';

export class ChannelMemberNotificationDto {
  @IsString()
  eventType: 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'MEMBER_UPDATED';

  @IsArray()
  @IsNumber({}, { each: true })
  channelPks: number[];

  @IsString()
  userEmail: string;

  @IsString()
  userName: string;

  @IsString()
  profileImagePath: string;
}
