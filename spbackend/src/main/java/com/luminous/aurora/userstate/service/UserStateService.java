package com.luminous.aurora.userstate.service;

import com.luminous.aurora.userstate.entity.UserState;
import com.luminous.aurora.userstate.entity.UserStatus;

import java.util.Optional;

public interface UserStateService {

    // 사용자 상태 생성 또는 업데이트
    UserState createOrUpdateUserState(Integer userPk, UserStatus status, Boolean isOnline);

    // 사용자 상태 조회
    Optional<UserState> getUserState(Integer userPk);

    // 사용자 온라인으로 설정
    UserState setUserOnline(Integer userPk);

    // 사용자 오프라인으로 설정
    UserState setUserOffline(Integer userPk);

    // 사용자 자리비움으로 설정
    UserState setUserAway(Integer userPk);

    // 사용자 방해금지로 설정
    UserState setUserDnd(Integer userPk);

}
