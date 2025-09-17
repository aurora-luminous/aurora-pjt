package com.luminous.aurora.userstate.service;

import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.member.repository.DmMemberRepository;
import com.luminous.aurora.project.entity.ProjectMember;
import com.luminous.aurora.project.repository.ProjectMemberRepository;
import com.luminous.aurora.userstate.entity.UserState;
import com.luminous.aurora.userstate.entity.UserStatus;
import com.luminous.aurora.userstate.repository.UserStateRedisRepository;
import com.luminous.aurora.userstate.repository.UserStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserStateServiceImpl implements UserStateService {

    private final UserStateRepository userStateRepository;
    private final UserStateRedisRepository redisRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final DmMemberRepository dmMemberRepository;

    // ====기본 상태 관리 ====
    @Override
    public UserStatus getUserStatus(Integer userPk) {
        // 1. 의도적 설정 상태 조회 (DB)
        Optional<UserState> userState = userStateRepository.findByUserPk(userPk);
        if (userState.isPresent() && userState.get().getStatus() != UserStatus.OFFLINE) {
            return userState.get().getStatus();
        }

        // 2. 자동상태 조회 (Redis)
        Optional<UserStatus> redisStatus = redisRepository.getUserStatus(userPk);
        if (redisStatus.isPresent()) {
            return redisStatus.get();
        }

        // 3. 기본값
        return UserStatus.OFFLINE;
    }

    @Override
    @Transactional
    public void setUserStatus(Integer userPk, UserStatus status) {
        UserState userState = userStateRepository.findByUserPk(userPk)
                .orElse(UserState.builder().userPk(userPk).build());

        userState.setStatus(status);
        userState.setLastSeen(LocalDateTime.now());

        userStateRepository.save(userState);

        log.info("사용자 상태 설정 : userPk = {}, status = {}", userPk, status);
    }
    @Override
    public void setUserOnline(Integer userPk) {
        // Redis에 자동상태 저장 (30분 만료)
        redisRepository.saveUserStatus(userPk, UserStatus.ONLINE, 30);
        log.debug("사용자 온라인 설정: userPk={}", userPk);
    }

    @Override
    public void setUserOffline(Integer userPk) {
        // Redis에서 자동상태 삭제
        redisRepository.deleteUserStatus(userPk);
        log.debug("사용자 오프라인 설정: userPk={}", userPk);
    }

    // ========== 프로젝트 멤버 조회 ==========

    @Override
    public List<ProjectMember> getProjectMembersWithStatus(Integer projectPk) {
        // 1. 프로젝트 멤버 조회
        List<ProjectMember> members = projectMemberRepository.findByProject_ProjectPk(projectPk);

        // 2. 상태별로 그룹화
        Map<UserStatus, List<ProjectMember>> statusGroups = new HashMap<>();

        for (ProjectMember member : members) {
            UserStatus status = getUserStatus(member.getUser().getUserPk());
            statusGroups.computeIfAbsent(status, k -> new ArrayList<>()).add(member);
        }

        // 3. 정렬 및 조합
        List<ProjectMember> result = new ArrayList<>();

        // 온라인/자리비움/방해금지: 권한별로 나누고 가나다순
        for (UserStatus status : Arrays.asList(UserStatus.ONLINE, UserStatus.AWAY, UserStatus.DND)) {
            List<ProjectMember> statusMembers = statusGroups.getOrDefault(status, new ArrayList<>());

            // 권한별로 그룹화
            Map<String, List<ProjectMember>> roleGroups = statusMembers.stream()
                    .collect(Collectors.groupingBy(ProjectMember::getProjectRole));

            // admin 먼저, member 나중에
            for (String role : Arrays.asList("admin", "member")) {
                List<ProjectMember> roleMembers = roleGroups.getOrDefault(role, new ArrayList<>());

                // 가나다순 정렬
                roleMembers.sort(Comparator.comparing(m -> m.getUser().getUserName()));
                result.addAll(roleMembers);
            }
        }

        // 오프라인: 권한 구분 없이 가나다순
        List<ProjectMember> offlineMembers = statusGroups.getOrDefault(UserStatus.OFFLINE, new ArrayList<>());
        offlineMembers.sort(Comparator.comparing(m -> m.getUser().getUserName()));
        result.addAll(offlineMembers);

        return result;
    }


    // ========== DM 멤버 조회 ==========

    @Override
    public List<DmMember> getDmMembers(Integer dmRoomPk) {
        // DM 멤버 조회 (최신순)
        return dmMemberRepository.findByDmRoom_DmRoomPkOrderByLastMessageTimeDesc(dmRoomPk);
    }
}