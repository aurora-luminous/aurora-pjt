package com.luminous.aurora.member.service;

import com.luminous.aurora.member.repository.ChannelMemberRepository;
import com.luminous.aurora.member.repository.DmMemberRepository;
import com.luminous.aurora.project.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final ChannelMemberRepository channelMemberRepository;
    private final DmMemberRepository dmMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    public boolean hasChannelAccess(Integer channelPk, Integer userPk) {
        try {
            boolean hasAccess = channelMemberRepository.existsByChannel_ChannelPkAndUser_UserPk(channelPk, userPk);

            log.debug("채널 접근 권한 확인 : channelPk = {}, userPk = {}, hasAccess={}", channelPk, userPk, hasAccess);
            return hasAccess;
        } catch (Exception e) {
            log.error("채널 접근 권한 확인 실패 : {}", e.getMessage());
            // 권환 확인 실패 시 안전하게 false 반환
            return false;
        }
    }

    @Override
    public boolean hasDmRoomAccess(Integer dmRoomPk, Integer userPk) {
        try {
            boolean hasAccess = dmMemberRepository.existsByDmRoom_DmRoomPkAndUser_UserPk(dmRoomPk, userPk);

            log.debug("DM방 접근 권한 확인 : dmRoomPk={}, userPk={}, hasAccess={}", dmRoomPk, userPk, hasAccess);
            return hasAccess;
        } catch (Exception e) {
            log.error("DM방 접근 권환 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean hasProjectAccess(Integer projectPk, Integer userPk) {
        try {
            return projectMemberRepository.existsByProject_ProjectPkAndUser_UserPk(projectPk, userPk);
        } catch (Exception e) {
            log.error("프로젝트 접근 권한 확인 실패 : {}", e.getMessage());
            return false;
        }
    }
}
