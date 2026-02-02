package com.luminous.aurora.member.repository;

import com.luminous.aurora.member.entity.DmMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DmMemberRepository extends JpaRepository<DmMember, Integer> {

    // DM 방 멤버인지 확인
    Optional<DmMember> findByDmRoom_DmRoomPkAndUser_UserPk(Integer dmRoomPk, Integer userPk);

    // DM방 멤버 존재 여부 확인
    boolean existsByDmRoom_DmRoomPkAndUser_UserPk(Integer dmRoomPk, Integer userPk);

    // 내가 참여한 DM 방 목록 조회 (최신 메시지순 )
    @Query("SELECT dm FROM DmMember dm " +
            "WHERE dm.user.userPk = :userPk " +
            "ORDER BY (SELECT MAX(m.createdAt) FROM Message m " +
            "WHERE m.dmRoomPk = dm.dmRoom) DESC NULLS LAST")
    List<DmMember> findMyDmRoomsOrderByLastMessage(@Param("userPk") Integer userPk);

    // DM 방의 모든 멤버 조회
    List<DmMember> findByDmRoom_DmRoomPk(Integer dmRoomPk);
}