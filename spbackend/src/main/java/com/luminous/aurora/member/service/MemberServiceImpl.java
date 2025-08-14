package com.luminous.aurora.member.service;

import com.luminous.aurora.member.repository.ChannelMemberRepository;
import com.luminous.aurora.member.repository.DmMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService{

    private final ChannelMemberRepository channelMemberRepository;
    private final DmMemberRepository dmMemberRepository;

    @Override
    public boolean hasChannelAccess(Integer channelPk, Integer userPk) {
        boolean hasAccess = channelMemberRepository.existsByChannelPkAndUserPk(channelPk, userPk);

        log.debug("채널 접근 권한 확인 : channelPk = {}, userPk = {}, hasAccess={}", channelPk, userPk, hasAccess);
        return hasAccess;
    }

    @Override
    public boolean hasDmRoomAccess(Integer dmRoomPk, Integer userPk) {
        boolean hasAccess = dmMemberRepository.existsByDmRoomPkAndUserPk(dmRoomPk, userPk);

        log.debug("DM방 접근 권한 확인 : dmRoomPk={}, userPk={}, hasAccess={}", dmRoomPk, userPk, hasAccess);
        return hasAccess;
    }
}
