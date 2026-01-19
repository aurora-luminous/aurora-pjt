package com.luminous.aurora.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;

@Slf4j
public class HttpHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        log.info("핸드셰이크 시작");
        // 핸드셰이크 단계에서 HTTP 요청의 쿠키를 읽음
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();

            // 쿠키에서 JWT 토큰 추출
            Cookie[] cookies = servletRequest.getCookies();
            if (cookies != null) {
                log.info("쿠키 개수: {}", cookies.length);

                Arrays.stream(cookies)
                        .filter(cookie -> "access_token".equals(cookie.getName()))
                        .findFirst()
                        .ifPresent(cookie -> {
                            attributes.put("jwt_token", cookie.getValue());
                            log.info("✅ JWT 토큰을 세션 속성에 저장: 완료");
                        });
            } else {
                log.warn("쿠키가 없습니다"); // ✅ 로그 추가
            }
        } else {
            log.warn(" ServletServerHttpRequest가 아닙니다: {}", request.getClass().getSimpleName());
        }
        log.info("🔐 핸드셰이크 완료, attributes: {}", attributes.keySet());
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // 핸드셰이크 완료 후 처리
    }
}
