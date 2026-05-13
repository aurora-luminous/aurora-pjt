package com.luminous.aurora.auth.controller;


import com.luminous.aurora.auth.dto.*;
import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.service.AuthService;
import com.luminous.aurora.auth.service.TokenService;
import com.luminous.aurora.common.error.exception.UnauthorizedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Slf4j
@RestController
@RequestMapping("/api/jv")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;

    @Value("${cookie.secure}")
    private boolean cookieSecure;

    @Value("${cookie.same-site}")
    private String cookieSameSite;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignUpRequest request) {
        log.info("회원가입 요청 : userEmail = {}", request.getUserEmail());
        authService.signUp(request);

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    /**
     * 로그인.
     * <p>
     * 응답 구성 (#225):
     * - Body: {@link AccessTokenResponse} — access token만 포함
     * - Cookie: {@code refresh_token} (HttpOnly, 7일)
     * <p>
     * access token은 더 이상 쿠키로 발급하지 않는다.
     * 클라이언트가 body에서 받아 메모리에 보관하고,
     * 이후 모든 인증 요청에 {@code Authorization: Bearer <token>} 헤더로 첨부해야 한다.
     */
    @PostMapping("/login")
    public ResponseEntity<AccessTokenResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("로그인 요청: Email = {}", request.getUserEmail());

        TokenResponse tokens = authService.login(request);

        ResponseCookie refreshCookie = buildRefreshCookie(tokens.getRefreshToken(), Duration.ofDays(30));


        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(AccessTokenResponse.builder()
                        .accessToken(tokens.getAccessToken())
                        .build());
    }

    /**
     * 로그아웃.
     * <p>
     * - Redis에서 access/refresh 토큰 삭제 (AuthService.logout)
     * - refresh_token 쿠키 만료 (maxAge=0)
     * - access token은 클라이언트가 메모리에서 폐기하면 된다 (서버에서 별도 삭제 불필요)
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal Users user) {

        authService.logout(user.getUserEmail());

        // 쿠키 삭제
        ResponseCookie refreshCookie = buildRefreshCookie("", Duration.ZERO);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body("로그아웃이 완료되었습니다.");
    }

    /**
     * Access token 재발급.
     * <p>
     * refresh_token 쿠키를 검증 후 새 access token + 새 refresh token을 발급한다.
     * <p>
     * 응답 구성 (#225):
     * - Body: 새 access token ({@link AccessTokenResponse})
     * - Cookie: 새 refresh_token (회전)
     * <p>
     * refresh token rotation: TokenService.refreshToken은 항상 새 refresh token을 함께 발급하고
     * Redis도 갱신한다. 컨트롤러는 그에 맞춰 새 refresh_token을 쿠키로 set한다.
     * <p>
     * NOTE: 이 엔드포인트는 access token이 만료된 상태에서도 호출되므로
     * {@code @AuthenticationPrincipal}을 사용하지 않고 refresh_token 쿠키로 사용자 식별을 수행한다.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponse> refreshToken(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        log.info("토큰 갱신 요청");
        if (!StringUtils.hasText(refreshToken)) {
            throw new UnauthorizedException("Refresh Token이 없습니다.");
        }

        TokenResponse tokens = tokenService.refreshToken(refreshToken);

        ResponseCookie refreshCookie = buildRefreshCookie(tokens.getRefreshToken(), Duration.ofDays(30));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(AccessTokenResponse.builder()
                        .accessToken(tokens.getAccessToken())
                        .build());
    }

    @GetMapping("/info")
    public ResponseEntity<AuthInfo> getUserInfo(@AuthenticationPrincipal Users user) {
        log.info("사용자 정보 조회 요청");
        AuthInfo userInfo = authService.getUserInfo(user.getUserEmail());
        return ResponseEntity.ok(userInfo);

    }

    /**
     * refresh_token 쿠키 빌더 (login/refresh/logout 공통).
     *
     * @param value 쿠키 값 (logout 시 빈 문자열 → 만료용)
     * @param maxAge 만료 시간 ({@link Duration#ZERO}이면 즉시 삭제)
     */
    private ResponseCookie buildRefreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from("refresh_token", value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .maxAge(maxAge)
                .path("/")
                .build();
    }
}
