package com.luminous.aurora.userstate.repository;

import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.project.entity.ProjectMember;
import com.luminous.aurora.userstate.entity.UserState;
import com.luminous.aurora.userstate.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserStateRepository extends JpaRepository<UserState, Integer> {

    // 특정 사용자 상태 조회 (의도적 설정)
    Optional<UserState> findByUserPk(Integer userPk);

    // 특정 상태의 사용자 목록 (의도적 설정)
    List<UserState> findByStatus(UserStatus status);

    // 특정 사용자들의 상태 조회 (의도적 설정)
    List<UserState> findByUserPkIn(List<Integer> userPks);

    // 특정 상태 사용자 수 (의도적 설정)
    long countByStatus(UserStatus status);

}
