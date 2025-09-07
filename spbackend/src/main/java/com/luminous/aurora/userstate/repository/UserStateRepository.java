package com.luminous.aurora.userstate.repository;

import com.luminous.aurora.userstate.entity.UserState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserStateRepository extends JpaRepository<UserState, Integer> {

    // 특정 사용자 상태 조회
    Optional<UserState> findByUserPk(Integer userPK);

    // 온라인 사용자 목록
    List<UserState> findByIsOnlineTrue();
}
