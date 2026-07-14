package com.luminous.aurora.auth.repository;


import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

// Redis 토큰 저장소
@Repository
public class TokenRedisRepository {
    private final RedisTemplate<String, String> redisTemplate;

    public TokenRedisRepository(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // 토큰 저장
    public void saveToken(String userId, String token, long expirationTime) {
        String key = "token:" + userId;
        redisTemplate.opsForValue().set(key, token, expirationTime, TimeUnit.MILLISECONDS);
        // 키 : 유저id, 밸류 : 토큰, 만료시간, 시간단위
    }

    // 토큰 조회
    public String getToken(String userId) {
        String key = "token:" + userId;
        return redisTemplate.opsForValue().get(key);
    }

    // 토큰 삭제
    public void deleteToken(String userId) {
        String key = "token:" + userId;
        redisTemplate.delete(key);
    }

    // 토큰 존재 여부 확인 -> 로그아웃 이후 접근시도시 false 나올거고 그럼 에러 던질용도
    public boolean hasToken(String userId) {
        String key = "token:" + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key)); // redis 작동이 원할하게 된다면 상관없지만 혹시몰라 null 체크
    }

}
