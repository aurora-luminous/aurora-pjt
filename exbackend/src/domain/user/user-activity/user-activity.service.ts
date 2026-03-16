export abstract class UserActivityService {

  // 마지막 채널 정보 가져오기
  abstract getLastConnectedChannel(userPk: number): Promise<any>;

  // 마지막 채널 정보 갱신 
  abstract updateLastConnectedChannel(userPk: number, channelPk: number): Promise<void>;

  // 유저가 속한 모든 채널 정보 가져오기
  abstract getAllChannelsForCurrentUser(userPk: number): Promise<any[]>;
}
