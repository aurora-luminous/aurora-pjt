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

    // DM 멤버 조회 (해당 DM룸의 가장 최근 메시지 시간으로 정렬)
    @Query("SELECT dm FROM DmMember dm " +
           "LEFT JOIN Message m ON dm.dmRoom = m.dmRoomPk " +
           "WHERE dm.dmRoom.dmRoomPk = :dmRoomPk " +
           "ORDER BY m.createdAt DESC")
    List<DmMember> findByDmRoom_DmRoomPkOrderByLastMessageTimeDesc(@Param("dmRoomPk") Integer dmRoomPk);
}
