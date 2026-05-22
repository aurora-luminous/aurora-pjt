package com.luminous.aurora.auth.service;


import com.luminous.aurora.common.error.exception.UnauthorizedException;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.auth.dto.TokenResponse;
import com.luminous.aurora.auth.repository.TokenRedisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenRedisRepository tokenRedisRepository;

    @Value("${jwt.access-token-validity}")
    private long accessTokenValidity;

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidity;

    @Override
    public TokenResponse generateTokens(String userEmail) {
        // Access Token 생성
        String accessToken = jwtTokenProvider.generateAccessToken(userEmail);

        // refreshToken 생성
        String refreshToken = jwtTokenProvider.generateRefreshToken(userEmail);

        // Redis에 토큰 저장
        tokenRedisRepository.saveToken(userEmail, accessToken, accessTokenValidity);
        tokenRedisRepository.saveToken(userEmail + ":refresh", refreshToken, refreshTokenValidity);

        log.info("토큰 생성 완료: userEmail = {}", userEmail);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    public boolean validateToken(String userEmail, String token) {
        try {
            // JWT 토큰 자체의 유효성 검증
            if (!jwtTokenProvider.validateToken(token)) {
                return false;
            }

            // Redis에 토큰이 존재하는지 확인 (로그아웃 체크)
            return tokenRedisRepository.hasToken(userEmail);
        } catch (Exception e) {
            log.error("토큰 검증 실패 : {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void logout(String userEmail) {
        tokenRedisRepository.deleteToken(userEmail);
        tokenRedisRepository.deleteToken(userEmail + ":refresh");
        log.info("로그아웃 완료 : userEmail = {}", userEmail);
    }

    @Override
    public TokenResponse refreshToken(String refreshToken) {

        // 1) JWT 자체 유효성 (서명,만료) 만료/위조면 여기서 false
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("유효하지 않은 Refresh Token 입니다.");
        }
        // 2) 클레임에서 사용자 식별
        String userEmail = jwtTokenProvider.getUserEmailFromToken(refreshToken);
        String refreshKey = userEmail + ":refresh";

        // 3) Redis 에 refresh 키가 없으면 로그아웃,만료,이미 회전된 세션
        if (!tokenRedisRepository.hasToken(refreshKey)) {
            throw new UnauthorizedException("유효하지 않은 Refresh Token 입니다.");
        }

        // 4) 키가 있는지만 확인하는게 아니라(기존방식) 저장된 문자열과 쿠키로 온 refresh가 같은지 확인 (rotation 핵심)
        String storedRefresh = tokenRedisRepository.getToken(refreshKey);
        if (storedRefresh == null || !storedRefresh.equals(refreshToken)) {
            throw new UnauthorizedException("유효하지 않은 Refresh Token 입니다");
        }

        // 5) 검증 통과 -> access,refresh 둘다 새로 발급 + Redis 덮어쓰기
        return generateTokens(userEmail);
    }
}
