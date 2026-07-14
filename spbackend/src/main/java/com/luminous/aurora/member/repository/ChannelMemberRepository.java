package com.luminous.aurora.member.repository;

import com.luminous.aurora.member.entity.ChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Integer> {


    // 채널 멤버인지 확인
    Optional<ChannelMember> findByChannel_ChannelPkAndUser_UserPk(Integer channelPk, Integer userPk);

    // 채널 멤버 존재 여부 확인
    boolean existsByChannel_ChannelPkAndUser_UserPk(Integer channelPk, Integer userPk);

    // Active 상태인 채널 멤버만 조회
    // cStatus가 c 단일 문자로 시작해 CStatus로 매핑이 제대로 되지 않아 @Query 어노테이션으로 직접 JPQL 작성
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.channelPk = :channelPk AND cm.cStatus = :cStatus")
    List<ChannelMember> findByChannelPkAndCStatus(@Param("channelPk") Integer channelPk, @Param("cStatus") String cStatus);
}
