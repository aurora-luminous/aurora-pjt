package com.luminous.aurora.member.repository;

import com.luminous.aurora.member.entity.DmMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DmMemberRepository extends JpaRepository<DmMember, Integer> {

    // DM 방 멤버인지 확인
    Optional<DmMember> findByDmRoomPkAndUserPk(Integer dmRoomPk, Integer userPk);

    // DM방 멤버 존재 여부 확인
    boolean existsByDmRoomPkAndUserPk(Integer dmRoomPk, Integer userPk);
}
