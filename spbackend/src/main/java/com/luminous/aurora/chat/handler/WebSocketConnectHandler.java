package com.luminous.aurora.chat.handler;

import com.luminous.aurora.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Arrays;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketConnectHandler {
    private final JwtTokenProvider jwtTokenProvider;

    // WebSocket 연결 시 JWT 토큰을 쿠키에 저장
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        HttpServletRequest request = (HttpServletRequest) event.getSource();

        try {
            // 쿠키에서 JWT 토큰 추출
            String jwtToken = extractJwtFromCookies(request);
            if (jwtToken != null && jwtTokenProvider.validateToken(jwtToken)) {
                //세션에 JWT 토큰 저장
                headerAccessor.getSessionAttributes().put("jwt_token", jwtToken);
                log.info("WebSocket 연결 성공 : JWT 토큰을 세션에 저장완료");
            } else {
                log.warn("WebSocket 연결 실패 : 유효하지 않은 JWT 토큰");
                // 연결 거부 처리
                headerAccessor.setUser(null);
            }
        } catch (Exception e) {
            log.error("WebSocket 연결 처리 중 오류 발생 : {}", e.getMessage());
            headerAccessor.setUser(null);
        }
    }

    // 웹소켓 연결 해제 시 로깅
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        log.info("WebSocket 연결 해제 : sessionId={}", headerAccessor.getSessionId());
    }

    // 쿠키에서 JWT 토큰 추출
    private String extractJwtFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            return Arrays.stream(cookies)
                    .filter(cookie -> "access_token".equals(cookie.getName()))
                    .findFirst()
                    .map(Cookie::getValue)
                    .orElse(null);
        }
        return null;
    }
}
