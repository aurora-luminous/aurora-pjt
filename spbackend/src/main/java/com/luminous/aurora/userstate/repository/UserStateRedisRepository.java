package com.luminous.aurora.userstate.repository;

import com.luminous.aurora.userstate.entity.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;


@Slf4j
@Repository
@RequiredArgsConstructor
public class UserStateRedisRepository {
    private final RedisTemplate<String, String> redisTemplate;

    private static final String USER_STATUS_KEY_PREFIX = "user:status:";

    // 사용자 상태 저장 (자동 상태용)
    public void saveUserStatus(Integer userPk, UserStatus status, long expirationMinutes) {
        String key = USER_STATUS_KEY_PREFIX + userPk;
        redisTemplate.opsForValue().set(key, status.name(), expirationMinutes, TimeUnit.MINUTES);
        log.debug("Redis에 사용자 상태 저장 : userPk = {}, status = {}, expiration = {} 분", userPk, status, expirationMinutes);
    }

    // 사용자 상태 조회
    public Optional<UserStatus> getUserStatus(Integer userPk) {
        String key = USER_STATUS_KEY_PREFIX + userPk;
        String status = redisTemplate.opsForValue().get(key);

        if (status != null) {
            try {
                UserStatus userStatus = UserStatus.valueOf(status);
                log.debug("Redis에서 사용자 상태 조회 : userPk = {}, status = {}", userPk, status);
                return Optional.of(userStatus);
            } catch (IllegalArgumentException e) {
                log.warn("Redis에 저장된 상태가 유효하지 않음 : userPk = {}, status = {}", userPk, status);
                return Optional.empty();
            }
        }
        log.debug("Redis에 사용자 상태 없음 : userPk ={}", userPk);
        return Optional.empty();
    }

    // 사용자 상태 삭제
    public void deleteUserStatus(Integer userPk) {
        String key = USER_STATUS_KEY_PREFIX + userPk;
        redisTemplate.delete(key);
        log.debug("Redis에서 사용자 상태 삭제 : userPk = {}", userPk);
    }

    // 특정 상태의 사용자 목록 조회 (자동 상태만)
    public Set<Integer> getUserPksByStatus(UserStatus status) {
        String pattern = USER_STATUS_KEY_PREFIX + "*";
        Set<String> keys = redisTemplate.keys(pattern);

        if (keys == null || keys.isEmpty()) {
            log.debug("상태별 사용자 없음: status={}", status);
            return Set.of();
        }

        Set<Integer> userPks = keys.stream()
                .filter(key -> status.name().equals(redisTemplate.opsForValue().get(key)))
                .map(key -> key.substring(USER_STATUS_KEY_PREFIX.length()))
                .map(Integer::parseInt)
                .collect(Collectors.toSet());

        log.debug("상태별 사용자 목록 조회: status={}, count={}", status, userPks.size());
        return userPks;
    }





















}
