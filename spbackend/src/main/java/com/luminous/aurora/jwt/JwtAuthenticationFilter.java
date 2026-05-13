package com.luminous.aurora.jwt;


import com.luminous.aurora.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor    // Lombok : final 필드만을 매개변수로 받는 생성자 자동 생성
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /**
     * Authorization 헤더 prefix
     * RFC 6750 표준에 따라 "Bearer " (대소문자 구분 x, 뒤 공백 1칸) 형식만 인식한다
     */
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;


    /**
     * 모든 HTTP 요청을 가로채 JWT access token 기반 인증을 수행한다.
     * <p>
     * 인증 흐름:
     * 1. {@code Authorization: Bearer <token>} 헤더에서 토큰 추출
     * 2. JwtTokenProvider로 토큰 검증 및 userEmail 파싱
     * 3. userEmail로 Users 엔티티 조회
     * 4. {@link SecurityContextHolder}에 {@link UsernamePasswordAuthenticationToken} 세팅
     * <p>
     * 인증 실패(토큰 없음/만료/형식 오류 등) 시에는 SecurityContext에 아무것도 세팅하지 않고
     * 그대로 다음 필터로 진행한다. 이후 SecurityConfig의 권한 규칙이 401/403 처리한다.
     * <p>
     * NOTE: WebSocket handshake(`/ws/**`)는 SecurityConfig에서 permitAll 처리되어 이 필터를 통과해도
     * 인증 객체가 비어있다. STOMP 인증은 별도의 ChannelInterceptor에서 CONNECT 시점에 수행한다.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. HTTP 요청에서 토큰 추출
            String token = getTokenFromRequest(request);

            // 2. JwtTokenProvider로 토큰 검증 + userEmail 추출, 토큰이 존재하고 유효한 경우에만 인증 처리
            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                // 3. 토큰에서 사용자 ID 추출 (JwtTokenProvider 사용)
                String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
                // 4. 사용자 ID로 데이터베이스에서 사용자 정보 조회
                userRepository.findByUserEmail(userEmail)
                        // 5. Spring Security 인증 토큰 생성
                        // - principal: 인증된 사용자 정보 (User 엔티티)
                        // - credentials: 인증 증명서 (JWT 토큰이므로 null)
                        // - authorities: 사용자의 권한 목록 (ROLE_USER)
                        .ifPresent(user -> {
                            UsernamePasswordAuthenticationToken authentication =    // UsernamePasswordAuthenticationToken = Spring Security의 인증 토큰 클래스
                                    new UsernamePasswordAuthenticationToken(
                                            user,   // principal: 인증된 사용자
                                            null,   // credentials: JWT 토큰이므로 null
                                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));// 권한: 기본 사용자 권한

                            // 6. Spring Security 컨텍스트에 인증 정보 설정
                            // - 이후 요청에서 @PreAuthorize, @Secured 등으로 권한 체크 가능
                            // - SecurityContextHolder.getContext().getAuthentication()로 현재 인증 정보 조회 가능
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                        });
            }

            // 7. 필터 체인 계속 진행 (다음 필터 또는 컨트롤러로 요청 전달)
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("JWT 인증 필터 처리 중 오류 발생", e);
            // 필터에서 예외가 발생해도 요청을 계속 진행 (인증 실패로 처리)
            filterChain.doFilter(request, response);
        }
    }

    /**
     * {@code Authorization: Bearer <token>} 헤더에서 access token을 추출한다.
     * <p>
     * 기존에는 {@code access_token} 쿠키에서 추출했으나, 본 작업(#225)으로
     * REST 인증을 헤더 기반으로 일원화하면서 쿠키 폴백을 제거했다.
     * 쿠키와 헤더를 둘 다 인식하면 어느 쪽이 신뢰원인지 모호해지고
     * "access token 쿠키 완전 제거" 목표가 미뤄지므로, 의도적으로 단일 경로만 둔다.
     * <p>
     * refresh token은 여전히 HttpOnly 쿠키로 유지된다 — 별도 처리 경로(POST /refresh)에서만 사용.
     *
     * @return 토큰 문자열 (헤더가 없거나 Bearer prefix가 아니면 {@code null})
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (!StringUtils.hasText(authHeader)) {
            return null;
        }

        if (!authHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }

        return authHeader.substring(BEARER_PREFIX.length()).trim();
    }
}
