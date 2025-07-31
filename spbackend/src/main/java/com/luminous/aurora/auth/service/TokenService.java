package com.luminous.aurora.user.service;


import com.luminous.aurora.user.dto.TokenResponse;

public interface TokenService {

    // 로그인인 시 토큰 생성 및 저장
    TokenResponse generateTokens(String userId);

    // 토큰 유효성 검증
    boolean validateToken(String userId, String token);

    // 로그아웃 시 토큰 삭제
    void logout(String userId);

    // 토큰 갱신
    TokenResponse refreshToken(String refreshToken);
}
