package com.luminous.aurora.jwt;


import com.luminous.aurora.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final JwtTokenProvider jwtTokenProvider;

    private final UserRepository userRepository;


    /**
     * HTTP 요청을 필터링하여 JWT 토큰 기반 인증을 수행
     *
     * @param filterChain 필터 체인 (다음 필터로 요청을 전달)
     * @throws ServletException 서블릿 예외
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException{
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
            filterChain.doFilter(request,response);
        } catch (Exception e) {
            log.error("JWT 인증 필터 처리 중 오류 발생 : {}", e.getMessage());
            // 필터에서 예외가 발생해도 요청을 계속 진행 (인증 실패로 처리)
            filterChain.doFilter(request, response);
        }
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        try {
            // 쿠키에서 토큰 추출
            Cookie[] cookies = request.getCookies();

            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("access_token".equals(cookie.getName())) {
                        return cookie.getValue();
                    }
                }
            }
            return null;
        } catch (Exception e) {
            log.error("토큰 추출 중 오류 발생 : {}", e.getMessage());
            return null;
        }
    }
}
