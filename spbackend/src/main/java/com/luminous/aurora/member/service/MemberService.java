package com.luminous.aurora.member.service;

public interface MemberService {

    // 채널 접근 권한 확인
    boolean hasChannelAccess(Integer channelPk, Integer userPK);

    // DM방 접근 권한 확인
    boolean hasDmRoomAccess(Integer dmRoomPk, Integer userPk);

}
