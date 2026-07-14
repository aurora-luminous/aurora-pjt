package com.luminous.aurora.member.service;

public interface MemberService {

    // 채널 접근 권한 확인
    boolean hasChannelAccess(Integer channelPk, Integer userPk);

    // DM방 접근 권한 확인
    boolean hasDmRoomAccess(Integer dmRoomPk, Integer userPk);

    /**
     * 프로젝트 접근 권한 검증
     * - 해당 프로젝트 멤버인 경우에만 true 반환
     */
    boolean hasProjectAccess(Integer projectPk, Integer userPk);

}
