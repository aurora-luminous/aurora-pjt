package com.luminous.aurora.member.repository;

import com.luminous.aurora.member.entity.ChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Integer> {


    // 채널 멤버인지 확인
    Optional<ChannelMember> findByChannel_ChannelPkAndUser_UserPk(Integer channelPk, Integer userPk);

    // 채널 멤버 존재 여부 확인
    boolean existsByChannel_ChannelPkAndUser_UserPk(Integer channelPk, Integer userPk);

    // 채널별 멤버 조회
    List<ChannelMember> findByChannel_ChannelPk(Integer channelPk);

}
