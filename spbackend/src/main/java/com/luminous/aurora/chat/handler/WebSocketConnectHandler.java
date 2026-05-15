package com.luminous.aurora.chat.handler;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.userstate.service.UserStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;


/**
 * STOMP(WebSocket) 세션이 맺어졌다/끊겼다 할 때, 사용자 온라인 상태를 UserState 쪽에 반영한다.
 *
 * <h2>이 클래스가 하지 않는 것 (중요)</h2>
 * <ul>
 *   <li><b>인증(Authentication)</b>을 여기서 하지 않는다. JWT 검증·Bearer 파싱은 전부
 *       {@link com.luminous.aurora.config.StompAuthChannelInterceptor} 가
 *       STOMP {@code CONNECT} 프레임이 들어올 때 수행한다.</li>
 *   <li>예전 설계처럼 HTTP 핸드셰이크에서 {@code access_token} 쿠키를 읽어
 *       세션 속성 {@code jwt_token}에 넣는 흐름은 폐기되었으므로, 이 처리기는
 *       {@code jwt_token}을 절대 기대하지 않는다.</li>
 * </ul>
 *
 * <h2>왜 {@code SessionConnectEvent}에서 {@code getUser()}만 보면 되나?</h2>
 * CONNECT 프레임이 인바운드 채널을 통과할 때 인터셉터가
 * {@link org.springframework.messaging.simp.stomp.StompHeaderAccessor#setUser(java.security.Principal)}
 * 로 이미 현재 사용자({@link Users})를 principal로 넣어 두었다.
 * 그 뒤에 스프링이 {@link SessionConnectEvent}를 발행하므로, 여기서는 그 결과를 <b>존중만</b> 하면 된다.
 *
 * <h2>절대 다시 하지 말 것</h2>
 * {@code jwt_token}이 없다고 {@code headerAccessor.setUser(null)} 을 호출하면,
 * 방금 인터셉터가 세팅한 principal을 망가뜨려 이후 {@code @AuthenticationPrincipal}·권한 검사가 꼬일 수 있다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketConnectHandler {

    private final UserStateService userStateService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        // CONNECT 메시지를 감싼 헤더 접근자. 여기에 native header, user, session attributes가 실린다.
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        try {
            // 인터셉터가 CONNECT 시 채워넣은 Spring security Authentication
            // 아직 null이면 : 이벤트 순서/버전 이슈 가능 -> 아래에서 WARN만 남기고 끝 (principal 망가뜨리지 않음).
            Principal userPrincipal = headerAccessor.getUser();
            if (!(userPrincipal instanceof Authentication auth
                    && auth.getPrincipal() instanceof Users user)) {
                log.warn("STOMP CONNECT 이후에도 Principal 이 Users가 아님."
                                + "StompAuthChannelInterceptor-CONNECT 헤더(Bearer)를 확인하세요. sessionId = {}",
                        headerAccessor.getSessionId());
                // 주의 : 여기서 setUser(null) 하지 않는다. 인증 실패는 CONNECT 단계에서 이미 거절되었어야 한다
                return;
            }

            // 연결 해제 시 setUserOffline에 쓰기 위해 세션에 userPk 보관 (기존 disconnect 로직과 호환)
            headerAccessor.getSessionAttributes().put("authenticated", Boolean.TRUE);
            headerAccessor.getSessionAttributes().put("user_pk", user.getUserPk());

            // Redis/DB 기반 "접속 중" 표시 (기존 동작 유지).
            userStateService.setUserOnline(user.getUserPk());

            log.info("WebSocket STOMP 연결 반영: userEmail ={}, userPK={}, sessionId ={}",
                    user.getUserEmail(), user.getUserPk(), headerAccessor.getSessionId());
        } catch (Exception e) {
            // 온라인 처리 실패해도 STOMP 세션 자체는 이미 열려 있을 수 있음. -> 로그만 남김
            log.error("WebSocket 연결 처리 중 오류 발생 : {}", headerAccessor.getSessionId(), e);
        }
    }

    /**
     * STOMP 세션 종료 시 호출된다 (탭 닫기, 네트워크 끊김, DISCONNECT 등).
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        try {
            // CONNECT 때 넣어 둔 userPk 우선 사용
            Integer userPk = (Integer) headerAccessor.getSessionAttributes().get("user_pk");

            // 일부 환경에서는 속성만 비어있고 user는 아직 accessor에 남아 있을 수 있어 fallback
            if (userPk == null) {
                Principal userPrincipal = headerAccessor.getUser();
                if (userPrincipal instanceof Authentication auth
                        && auth.getPrincipal() instanceof Users user) {
                    userPk = user.getUserPk();
                }
            }
            if (userPk != null) {
                // 사용자를 오프라인 상태로 설정
                userStateService.setUserOffline(userPk);
                log.info("WebSocket 연결 해제 : userPk={}, sessionId={}", userPk, headerAccessor.getSessionId());
            } else {
                log.info("WebSocket 연결 해제 : sessionId={}", headerAccessor.getSessionId());
            }
        } catch (Exception e) {
            log.error("WebSocket 연결 해제 처리 중 오류 발생: sessionId={}", headerAccessor.getSessionId(), e);
        }
    }

}
