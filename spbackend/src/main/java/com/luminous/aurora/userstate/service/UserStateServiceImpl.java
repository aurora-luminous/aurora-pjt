package com.luminous.aurora.userstate.service;

import com.luminous.aurora.userstate.entity.UserState;
import com.luminous.aurora.userstate.entity.UserStatus;
import com.luminous.aurora.userstate.repository.UserStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserStateServiceImpl implements UserStateService {

    private final UserStateRepository userStateRepository;

    @Override
    public UserState createOrUpdateUserState(Integer userPk, UserStatus status, Boolean isOnline) {
        Optional<UserState> existingState = userStateRepository.findByUserPk(userPk);

        if (existingState.isPresent()) {
            // 기존 상태 업데이트
            UserState userState = existingState.get();
            userState.setStatus(status);
            userState.setIsOnline(isOnline);
            userState.setLastSeen(LocalDateTime.now());

            log.info("사용자 상태 업데이트: userPk={}, status={}, isOnline={}", userPk, status, isOnline);
            return userStateRepository.save(userState);
        } else {
            // 새로운 상태 생성
            UserState newState = UserState.builder()
                    .userPk(userPk)
                    .status(status)
                    .isOnline(isOnline)
                    .lastSeen(LocalDateTime.now())
                    .build();

            log.info("새로운 사용자 상태 생성: userPk={}, status={}, isOnline={}", userPk, status, isOnline);
            return userStateRepository.save(newState);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserState> getUserState(Integer userPk) {
        return userStateRepository.findByUserPk(userPk);
    }

    @Override
    public UserState setUserOnline(Integer userPk) {
        return createOrUpdateUserState(userPk, UserStatus.ONLINE, true);
    }

    @Override
    public UserState setUserOffline(Integer userPk) {
        return createOrUpdateUserState(userPk, UserStatus.OFFLINE, false);
    }

    @Override
    public UserState setUserAway(Integer userPk) {
        return createOrUpdateUserState(userPk, UserStatus.AWAY, true);
    }

    @Override
    public UserState setUserDnd(Integer userPk) {
        return createOrUpdateUserState(userPk, UserStatus.DND, true);
    }
}