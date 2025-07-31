package com.luminous.aurora.user.service;


import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.user.dto.TokenResponse;
import com.luminous.aurora.user.repository.TokenRedisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.antlr.v4.runtime.Token;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService{

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenRedisRepository tokenRedisRepository;

    @Value("${jwt.access-token-validity}")
    private long accessTokenValidity;

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidity;

    @Override
    public TokenResponse generateTokens(String userId) {
        // Access Token 생성
        String accessToken = jwtTokenProvider.generateAccessToken(userId);

        // refreshToken 생성
        String refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        // Redis에 토큰 저장
        tokenRedisRepository.saveToken(userId, accessToken, accessTokenValidity);
        tokenRedisRepository.saveToken(userId+ ":refresh", refreshToken, refreshTokenValidity);

        log.info("토큰 생성 완료: userId = {}", userId);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    public boolean validateToken(String userId, String token) {

        // JWT 토큰 자체의 유효성 검증
        if (!jwtTokenProvider.validateToken(token)){
            return false;
        }

        // Redis에 토큰이 존재하는지 확인 (로그아웃 체크)
        return tokenRedisRepository.hasToken(userId);
    }

    @Override
    public void logout(String userId) {

        tokenRedisRepository.deleteToken(userId);
        tokenRedisRepository.deleteToken(userId + ":refresh");
        log.info("로그아웃 완료 : userId = {}",userId);
    }

    @Override
    public TokenResponse refreshToken(String refreshToken) {
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // refresh token이 redis에 있는지 확인
        if (!tokenRedisRepository.hasToken(userId + ":refresh")) {
            throw new RuntimeException("유효하지 않은 Refresh Token입니다.");
        }
        // 있다면 새로운 토큰 생성
        return generateTokens(userId);
    }

}
