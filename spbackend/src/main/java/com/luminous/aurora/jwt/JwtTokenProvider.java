package com.luminous.aurora.jwt;

import java.util.Date;

import javax.crypto.SecretKey;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Slf4j //로그용 어노테이션
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-validity}")
    private Long accessTokenValidity;

    @Value("${jwt.refresh-token-validity}")
    private Long refreshTokenValidity;

    // 문자열 형태의 비밀키를 jwt 서명에 사용할 수 있는 secertkey 객체로 변환하는 역할
    private SecretKey getSigningKey() { // SecretKey -> Java의 암호화 키 인터페이스
        // hmac-sha256 알고리즘으로 서명키 생성
        log.info("JWT Secret: {}", jwtSecret); // 디버깅용 로그 추가
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
        // Keys.hmacShaKeyFor -> jjwt 라이브러리 메서드, 문자열을 HMAC키로 변환
        // jwtSecret.getBytes() -> 문자열을 바이트 배열로 변환
    }

    // Access Token 생성
    public String generateAccessToken(String userEmail) {
        return generateToken(userEmail, accessTokenValidity);
    }

    // Refresh Token 생성
    public String generateRefreshToken(String userEmail) {
        return generateToken(userEmail, refreshTokenValidity);
    }

    private String generateToken(String userEmail, Long validity) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + validity);

        return Jwts.builder()
                .subject(userEmail)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // 토큰에서 userEmail 추출
    public String getUserEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            log.info("Validating token: {}", token.substring(0, Math.min(50, token.length())) + "..."); // 토큰 일부 로그
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token : {}", e.getMessage());
            return false;
        }
    }
}
