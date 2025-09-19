package com.luminous.aurora.chat.handler;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.common.error.exception.NotFoundException;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.userstate.service.UserStateService;
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
    private final UserRepository userRepository;
    private final UserStateService userStateService;

    // WebSocket 연결 시 JWT 토큰을 쿠키에 저장
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        try {
            // 핸드셰이크에서 저장한 JWT 토큰을 세션에서 가져옴
            String jwtToken = (String) headerAccessor.getSessionAttributes().get("jwt_token");
            if (jwtToken != null && jwtTokenProvider.validateToken(jwtToken)) {
                String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
                Integer userPk = userRepository.findUserPkByUserEmail(userEmail)
                        .orElseThrow(()-> new NotFoundException("사용자를 찾을 수 없습니다."));
                // JWT가 유효하면 연결 허용
                headerAccessor.getSessionAttributes().put("authenticated",true);
                headerAccessor.getSessionAttributes().put("user_pk", userPk);
                userStateService.setUserOnline(userPk);
                log.info("WebSocket 연결 성공 : 인증된 사용자 - userEmail ={}", userEmail);
            } else {
                log.warn("WebSocket 연결 실패 : 인증 실패");
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

        try {
            // 세션에서 userPk 추출
            Integer userPk = (Integer) headerAccessor.getSessionAttributes().get("user_pk");
            if (userPk != null) {
                // 사용자를 오프라인 상태로 설정
                userStateService.setUserOffline(userPk);
                log.info("WebSocket 연결 해제 : userPk={}, sessionId={}", userPk, headerAccessor.getSessionId());
            } else {
                log.info("WebSocket 연결 해제 : sessionId={}", headerAccessor.getSessionId());
            }
        } catch (Exception e) {
            log.error("WebSocket 연결 해제 처리 중 오류 발생 : {}", e.getMessage());
        }
    }

}
