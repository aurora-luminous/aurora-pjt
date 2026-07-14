package com.luminous.aurora.config;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Slf4j
@Component
// 같은 inbound 채널에 인터셉터가 여러 개일 때, 숫자가 작을수록 더 앞(먼저)에 가깝게 실행되기 Eo문에
// HIGHEST_PRECEDENCE로 가장 먼저 + 99로 약간의 여유두기
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
// WebSocket + STOMP 메시지가 MessageChannel 을 탈 때마다 preSend 등으로 가로챔 (클라이언트 -> 서버방향)
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // STOMP 전용 헤더 접근자. Message가 STOMP가 아니면 null일 수 있음
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // 내부 시스템 메시지 등 STOMP 아닌 경우: 인증대상 아님, 그대로 통과
        if (accessor == null) {
            return message;
        }

        // CONNECT = STOMP 세션 수립 1단계. 보통 이때만 Authorization을 실어 보냄
        // 이후 SEND/SUBSCRIBE 는 매번 토큰을 안 보내는 클라가 많아서, 여기서만 검증하고 세션에 principal 저장
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        }

        return message;
    }

    /**
     * STOMP CONNECT 헤더에서 access token을 검증하고 principal을 세팅한다.
     *
     * @throws MessagingException 토큰 미존재/형식 오류/검증 실패 시.
     *                            STOMP ERROR 프레임으로 클라이언트에 전달되고 연결이 끊긴다.
     */
    private void authenticate(StompHeaderAccessor accessor) {
        // STOMP 네이티브 헤더에서 읽음 (HTTP ServletRequest가 아님)
        String authHeader = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);

        // 헤더 자체가 없거나 Bearer 형식이 아니면 JWT 추출 자체가 불가
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            log.warn("STOMP CONNECT 인증 실패 : Authorization 헤더 누락/형식 오류");

            // STOMP 쪽 실패 경로. @ControllerAdvice 가 아니라 메시징 레이어에서 처리되는 점 유의
            throw new MessagingException("Authorization 헤더가 필요합니다.");
        }

        // Bearer 이후가 실제 jwt 문자열
        String token = authHeader.substring(BEARER_PREFIX.length()).trim();

        // 서명/만료 등 JWT 자체 유효성
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("STOMP CONNECT 인증 실패: 유효하지 않은 토큰");
            throw new MessagingException("유효하지 않은 access token 입니다.");
        }

        // 토큰 클레임에서 식별자(이메일) 꺼냄 - 프로젝트 jwt 설계와 동일
        String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
        // JWT가 살아 있어도 DB에 없는 유저면 거절 (삭제/불일치 대비)
        Users user = userRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> {
                    log.warn("STOMP CONNECT 인증 실패: 사용자 없음 - userEmail = {}", userEmail);
                    return new MessagingException("사용자를 찾을 수 없습니다.");
                });

        // Spring Security 가 이해하는 "로그인 객체" principal로 User 엔티티를 넣어두면
        // 이후 @AuthenticationPrincipal Users로 꺼내쓰기 쉬움
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null, // 비밀번호 자리 - JWT 흐름에서는 보통 null
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

        // 같은 WebSocket/STOMP 세션의 이후 메시지에서 이 사용자가 이어짐
        accessor.setUser(authentication);

        log.info("STOMP CONNECT 인증 성공: userEmail = {}", userEmail);
    }
}
