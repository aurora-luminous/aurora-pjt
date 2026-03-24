import { ChannelMemberDto, RemoveFromChannelDto, BulkInviteToChannelDto } from "../dto";

export abstract class ChannelMemberService{

  // 멤버 초대
  abstract inviteUsersToChannel(bulkInviteDto: BulkInviteToChannelDto): Promise<{ message: string }>;

  // 공개 채널 참가
  abstract joinPublicChannel(channelPk: number, userPk: number): Promise<ChannelMemberDto>;

  // 채널 멤버 목록 조회
  abstract getChannelMembers(channelPk: number, requestUserPk: number): Promise<ChannelMemberDto[]>;

  // 멤버 내보내기 (강퇴)
  abstract removeUserFromChannel(removeDto: RemoveFromChannelDto): Promise<void>;

  // 채널 나가기
  abstract leaveChannel(channelPk: number, userPk: number): Promise<{ message: string }>;

  //멤버 차단 및 해제
  abstract banUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<void>;
  abstract unbanUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<ChannelMemberDto>;

  // 멤버 권한 변경
  abstract updateMemberRole(
    channelPk: number,
    targetUserPk: number,
    newRole: string,
    adminUserPk: number
  ): Promise<{ message: string }>;

  // 멤버 음소거 토글(미구현)
  abstract toggleMemberMute(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<ChannelMemberDto>;

}