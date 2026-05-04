package com.luminous.aurora.userstate.service;

import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.repository.MessageRepository;
import com.luminous.aurora.member.dto.ChannelMemberResponse;
import com.luminous.aurora.member.dto.DmRoomResponse;
import com.luminous.aurora.member.entity.ChannelMember;
import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.member.repository.ChannelMemberRepository;
import com.luminous.aurora.member.repository.DmMemberRepository;
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
    private final ChannelMemberRepository channelMemberRepository;
    private final DmMemberRepository dmMemberRepository;
    private final MessageRepository messageRepository;

    // ====기본 상태 관리 ====
    @Override
    public UserStatus getUserStatus(Integer userPk) {
        try {
            // 1. 의도적 설정 상태 조회 (DB)
            Optional<UserState> userState = userStateRepository.findByUserPk(userPk);
            if (userState.isPresent()) {
                UserStatus dbStatus = userState.get().getStatus();

                // ONLINE 설정 시만 redis 확인
                if (dbStatus == UserStatus.ONLINE) {
                    Optional<UserStatus> redisStatus = redisRepository.getUserStatus(userPk);

                    if (redisStatus.isPresent()) {
                        return redisStatus.get(); // ONLINE 또는 AWAY
                    } else {
                        return UserStatus.OFFLINE; // 연결 끊김
                    }
                }
                // AWAY, DND, OFFLINE 바로 반환 (명시적 설정 우선)
                return dbStatus;
            }

            // 2. DB 없으면 Redis 자동 상태 확인자동상태 조회
            Optional<UserStatus> redisStatus = redisRepository.getUserStatus(userPk);
            return redisStatus.orElse(UserStatus.OFFLINE);

        } catch (Exception e) {
            log.error("사용자 상태 조회 실패 : {}", e.getMessage());
            // 상태 조회 실패 시 안전하게 OFFLINE 반환
            return UserStatus.OFFLINE;
        }
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
        try {
            // Redis에 자동상태 저장 (30분 만료)
            redisRepository.saveUserStatus(userPk, UserStatus.ONLINE, 30);
            log.debug("사용자 온라인 설정: userPk={}", userPk);
        } catch (Exception e) {
            log.error("사용자 온라인 설정 실패 : {}", e.getMessage());
            // Redis는 캐시이므로 오류가 발생해도 치명적이지 않기 때문에 로그만 기록하고 진행
        }
    }

    // 자동 자리비움 설정
    @Override
    public void setUserAway(Integer userPk) {
        try {
            redisRepository.saveUserStatus(userPk, UserStatus.AWAY, 30);
            log.debug("사용자 자동 자리 비움 설정(Redis) : userPk = {}", userPk);
        } catch (Exception e) {
            log.error("사용자 자동 자리비움 설정 실패 : {}", e.getMessage());
        }
    }

    @Override
    public void setUserOffline(Integer userPk) {
        try {
            // Redis에서 자동상태 삭제
            redisRepository.deleteUserStatus(userPk);
            log.debug("사용자 오프라인 설정: userPk={}", userPk);
        } catch (Exception e) {
            log.error("사용자 오프라인 설정 실패 : {}", e.getMessage());
        }
    }

    // ========== 채널 멤버 조회 ==========

    @Override
    public List<ChannelMemberResponse> getChannelMemberWithStatus(Integer channelPk) {
        // 1. 채널 Active 멤버 조회
        List<ChannelMember> members = channelMemberRepository.findByChannelPkAndCStatus(channelPk,"Active");

        // 2. 상태별로 그룹화
        Map<UserStatus, List<ChannelMember>> statusGroups = new HashMap<>();
        Map<Integer, UserStatus> statusCache = new HashMap<>();

        for (ChannelMember member : members) {
            Integer userPk = member.getUser().getUserPk();
            UserStatus status = getUserStatus(userPk);
            statusCache.put(userPk, status);
            statusGroups.computeIfAbsent(status, k -> new ArrayList<>()).add(member);
        }

        // 3. 정렬 및 조합
        List<ChannelMember> result = new ArrayList<>();

        // 온라인/자리비움/방해금지: 권한별로 나누고 가나다순
        for (UserStatus status : Arrays.asList(UserStatus.ONLINE, UserStatus.AWAY, UserStatus.DND)) {
            List<ChannelMember> statusMembers = statusGroups.getOrDefault(status, new ArrayList<>());

            // 권한별로 그룹화
            Map<String, List<ChannelMember>> roleGroups = statusMembers.stream()
                    .collect(Collectors.groupingBy(ChannelMember::getChannelRole));

            // admin 먼저, member 나중에
            for (String role : Arrays.asList("admin", "member")) {
                List<ChannelMember> roleMembers = roleGroups.getOrDefault(role, new ArrayList<>());

                // 가나다순 정렬
                roleMembers.sort(Comparator.comparing(m -> m.getUser().getUserName()));
                result.addAll(roleMembers);
            }
        }

        // 오프라인: 권한 구분 없이 가나다순
        List<ChannelMember> offlineMembers = statusGroups.getOrDefault(UserStatus.OFFLINE, new ArrayList<>());
        offlineMembers.sort(Comparator.comparing(m -> m.getUser().getUserName()));
        result.addAll(offlineMembers);

        // 4. DTO 변환
        return result.stream()
                .map(member -> {
                    return ChannelMemberResponse.builder()
                            .userName(member.getUser().getUserName())
                            .userEmail(member.getUser().getUserEmail())
                            .profileImage(member.getUser().getProfileImagePath())
                            .channelRole(member.getChannelRole())
                            .userStatus(statusCache.get(member.getUser().getUserPk()))
                            .build();
                })
                .collect(Collectors.toList());
    }


    // ========== DM 방 조회 ==========

    @Override
    public List<DmRoomResponse> getDmRoomsWithStatus(Integer userPk) {
        // 1. 내 DM 멤버 조회 (최신 메시지순)
        List<DmMember> myDmMembers = dmMemberRepository.findMyDmRoomsOrderByLastMessage(userPk);

        // 2. 각 DM 방 정보 조합
        return myDmMembers.stream()
                .map(myDmMember -> {
                    Integer dmRoomPk = myDmMember.getDmRoom().getDmRoomPk();

                    // 2-1. 상대방 찾기
                    List<DmMember> allMembers = dmMemberRepository.findByDmRoom_DmRoomPk(dmRoomPk);
                    DmMember otherMember = allMembers.stream()
                            .filter(member -> !member.getUser().getUserPk().equals(userPk))
                            .findFirst()
                            .orElse(null);

                    if (otherMember == null) {
                        return null;
                    }

                    // 2-2 상대방 상태 조회
                    Integer otherUserPk = otherMember.getUser().getUserPk();
                    UserStatus otherUserStatus = getUserStatus(otherUserPk);

                    // 2-3 마지막 메시지 조회
                    Message lastMessage = messageRepository
                            .findLatestMessageInDmRoom(dmRoomPk)
                            .orElse(null);

                    // 2-4 읽지 않은 메시지 개수
                    Integer unreadCount = 0;
                    if (myDmMember.getLastReadMessage() != null) {
                        Long count = messageRepository.countUnreadMessages(
                                dmRoomPk,
                                myDmMember.getLastReadMessage().getMessagePk(),
                                userPk
                        );
                        unreadCount = count.intValue();
                    }

                    // 2-5 DTO 생성
                    return DmRoomResponse.builder()
                            .dmRoomPk(dmRoomPk)
                            .otherUserEmail(otherMember.getUser().getUserEmail())
                            .otherUserName(otherMember.getUser().getUserName())
                            .otherProfileImage(otherMember.getUser().getProfileImagePath())
                            .isMute(myDmMember.getIsMute())
                            .userStatus(otherUserStatus)
                            .lastMessageContent(lastMessage != null ? lastMessage.getContent() : null)
                            .lastMessageTime(lastMessage != null ? lastMessage.getCreatedAt() : null)
                            .unreadCount(unreadCount)
                            .build();
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }
}