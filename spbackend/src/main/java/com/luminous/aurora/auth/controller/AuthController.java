package com.luminous.aurora.auth.controller;


import com.luminous.aurora.auth.dto.LoginRequest;
import com.luminous.aurora.auth.dto.SignUpRequest;
import com.luminous.aurora.auth.dto.TokenResponse;
import com.luminous.aurora.auth.service.AuthService;
import com.luminous.aurora.auth.service.TokenService;
import com.luminous.aurora.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignUpRequest request) {
        log.info("회원가입 요청 : userEmail = {}", request.getUserEmail());
        authService.signUp(request);

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }


    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        log.info("로그인 요청: Email = {}",request.getUserEmail());

        TokenResponse tokens = authService.login(request);

        // HttpOnly 쿠키 설정 (XSS 방지)
        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokens.getAccessToken())
                .httpOnly(true)
                .secure(false) // 개발 환경에서는 false (HTTP 허용), 프로덕션에서는 true(HTTPS만 허용)
                .sameSite("Lax") // 개발 환경에서는 Lax , 프로덕션에서는 Strict, nginx 프록시로 같은 도메인 통일 시 변경
                .maxAge(Duration.ofHours(1))
                .path("/")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", tokens.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .maxAge(Duration.ofDays(7))
                .path("/")
                .build();


        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokens);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@CookieValue("access_token") String token) {
        log.info("로그아웃 요청");

        if (token == null) {
            return ResponseEntity.badRequest().body("토큰이 없습니다.");
        }

        try {
        // 토큰에서 userEmail 추출
        String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
        authService.logout(userEmail);

        // 쿠키 삭제
        ResponseCookie accessCookie = ResponseCookie.from("access_token","")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .maxAge(0) // 즉시 삭제
                .path("/")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .maxAge(0)
                .path("/")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body("로그아웃이 완료되었습니다.");
        } catch (Exception e) {
            log.error("로그아웃 중 에러 발생 : {}", e.getMessage());
            return ResponseEntity.badRequest().body("유효하지 않은 토큰입니다.");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(@CookieValue("refresh_token") String refreshToken) {
        log.info("토큰 갱신 요청");
        if (refreshToken == null ){
            return ResponseEntity.badRequest().body(TokenResponse.builder()
                    .accessToken("")
                    .refreshToken("")
                    .build());
        }

        try {
        TokenResponse tokens = tokenService.refreshToken(refreshToken);

        // 새로운 accesstoken 쿠키 설정
        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokens.getAccessToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .maxAge(Duration.ofHours(1))
                .path("/")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .body(tokens);
        } catch (Exception e) {
            log.error("토큰 갱신 중 에러 발생 : {}", e.getMessage());
            return ResponseEntity.badRequest().body(TokenResponse.builder()
                    .accessToken("")
                    .refreshToken("")
                    .build());
        }
    }

}
