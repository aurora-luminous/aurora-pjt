package com.luminous.aurora.config;

import com.luminous.aurora.auth.entity.Users;
import org.springframework.core.MethodParameter;
import org.springframework.lang.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.security.Principal;
import java.util.Optional;

/**
 * STOMP 메시지 핸들러에서 @AuthenticationPrincipal 과 Users 타입을 함께 쓸 때 주입을 담당한다.
 *
 * 배경: 기본 설정에서는 Payload용 리졸버가 @Payload 없는 파라미터도 JSON 본문으로 채우려 한다.
 * 그래서 Users user 가 실제 로그인 사용자가 아니라 메시지 body 를 Users 로 잘못 맞춘 객체(userPk 만 null 인 빈 객체)가 될 수 있다.
 *
 * 이 리졸버는 WebSocketConfig 의 addArgumentResolvers 로 등록해 Payload 리졸버보다 먼저 실행되게 한다.
 * 값은 오직 STOMP 메시지 헤더에 실린 세션 사용자(Principal) 만 사용한다.
 *
 * CONNECT 시점에 StompAuthChannelInterceptor 가 JWT 검증 후 setUser(Authentication) 으로 넣어 둔 principal 과 같은 출처다.
 */
public class StompAuthenticationPrincipalArgumentResolver implements HandlerMethodArgumentResolver {

    /**
     * 이 리졸버가 해당 파라미터를 처리할지 여부.
     * 스프링은 등록된 리졸버를 순서대로 두고, true 인 첫 리졸버에게만 resolveArgument 를 넘긴다.
     * Payload 리졸버가 넓게 잡혀 있어도 여기서 먼저 가로채야 한다.
     */
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // @AuthenticationPrincipal 이 없으면 "현재 인증 주체" 주입이 아님
        if (parameter.getParameterAnnotation(AuthenticationPrincipal.class) == null) {
            return false;
        }

        // Optional<Users> 면 안쪽 타입 기준으로 판단
        MethodParameter nested = parameter.nestedIfOptional();
        Class<?> type = nested.getNestedParameterType();

        // Users 또는 그 하위 타입만 처리
        return Users.class.isAssignableFrom(type);
    }

    /**
     * STOMP 인바운드 메시지 헤더에서 Users 를 꺼내 컨트롤러 인자로 넘긴다.
     * Optional<Users> 면 값이 없을 때 Optional.empty() 로 돌려준다.
     */
    @Override
    @Nullable
    public Object resolveArgument(MethodParameter parameter, Message<?> message) {
        Users user = resolveUsersFromMessage(message);

        if (parameter.isOptional()) {
            return Optional.ofNullable(user);
        }
        return user;
    }

    /**
     * 메시지 헤더의 Principal 을 Users 로만 안전하게 바꾼다.
     *
     * SimpMessageHeaderAccessor.getUser: 같은 WebSocket STOMP 세션에 묶인 현재 사용자.
     * CONNECT 때 인터셉터가 넣어 두면 이후 SEND 등에도 같은 사용자가 헤더로 이어진다.
     *
     * Principal 선언 타입이어도 실제로는 Authentication 이 오는 경우가 많다.
     * getPrincipal() 이 Users 일 때만 성공. 그 외는 null 이며 상위에서 인증 실패로 처리하면 된다.
     */
    @Nullable
    private static Users resolveUsersFromMessage(Message<?> message) {
        Principal principal = SimpMessageHeaderAccessor.getUser(message.getHeaders());
        if (principal == null) {
            return null;
        }

        if (principal instanceof Authentication authentication) {
            Object p = authentication.getPrincipal();
            if (p instanceof Users users) {
                return users;
            }
        }

        return null;
    }
}