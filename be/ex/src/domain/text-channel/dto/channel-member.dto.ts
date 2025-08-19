import { ApiProperty } from '@nestjs/swagger';

export class ChannelMemberUserInfoDto {
  @ApiProperty({ description: '사용자명' })
  userName: string;

  @ApiProperty({ description: '사용자 이메일' })
  userEmail: string;

  @ApiProperty({ description: '프로필 이미지 경로' })
  profileImagePath: string;
}

export class ChannelMemberDto {

  @ApiProperty({ 
    description: '채널 상태',
    enum: ['Active', 'Inactive', 'Banned']
  })
  cStatus: 'Active' | 'Inactive' | 'Banned';

  @ApiProperty({ 
    description: '채널 역할',
    enum: ['member', 'admin', 'owner']
  })
  channelRole: 'member' | 'admin' | 'owner';

  @ApiProperty({ description: '음소거 여부' })
  isMute: boolean;

  @ApiProperty({ 
    description: '마지막 읽은 메시지',
    required: false
  })
  lastReadMessage?: number;

  @ApiProperty({ 
    description: '사용자 정보',
    type: ChannelMemberUserInfoDto
  })
  userInfo: ChannelMemberUserInfoDto;
}