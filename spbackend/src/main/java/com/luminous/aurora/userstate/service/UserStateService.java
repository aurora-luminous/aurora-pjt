package com.luminous.aurora.userstate.service;

import com.luminous.aurora.member.dto.ChannelMemberResponse;
import com.luminous.aurora.member.dto.DmRoomResponse;
import com.luminous.aurora.userstate.entity.UserStatus;

import java.util.List;


public interface UserStateService {

    // 사용자 상태 조회 (의도적 설정 + 자동 상태)
    UserStatus getUserStatus(Integer userPk);

    // 사용자 상태 설정 (의도적 설정)
    void setUserStatus(Integer userPk, UserStatus status);

    // 사용자 온라인 상태 설정(자동)
    void setUserOnline(Integer userPk);

    // 사용자 자리비움 상태 설정 (자동, 비활동 감지시)
    void setUserAway(Integer userPk);

    // 사용자 오프라인 상태 설정(자동)
    void setUserOffline(Integer userPk);

    // ==== 채널 멤버 조회===

    // 채널 멤버 조회 (권한별 + 상태별 + 가나다순)
    // 온라인/자리비움/방해금지 : 권한별로 나누고 가나다순
    // 오프라인 : 권한 구분 없이 가나다순

    List<ChannelMemberResponse> getChannelMemberWithStatus(Integer channelPk);

    // ===== DM 멤버 조회 ========
    // DM멤버 조회 (최신 메시지순 + 상태 + unreadCount)
    List<DmRoomResponse> getDmRoomsWithStatus(Integer userPk);

}