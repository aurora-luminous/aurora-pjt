package com.luminous.aurora.config;


import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트가 서버로 메시지를 보낼 때 사용할 prefix
        config.setApplicationDestinationPrefixes("/app");

        // 서버가 클라이언트에게 메시지를 사용할 prefix
        config.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Websocket 연결 엔드포인트
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://localhost:8080",
                        "https://auro-ra.site",
                        "http://127.0.0.1:5500")
                .withSockJS();
    }

    /**
     * Client → Server 메시지 채널에 STOMP 인증 인터셉터 등록 (#225).
     * <p>
     * {@link StompAuthChannelInterceptor}가 STOMP CONNECT 시점에
     * Authorization 헤더 검증 + Principal 세팅을 수행한다.
     * 이후 컨트롤러는 {@code @AuthenticationPrincipal Users user} 또는 {@code Principal}로
     * 사용자 정보에 접근한다.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }

    /**
     * @MessageMapping 메서드에 넘길 인자 리졸버를 등록한다.
     * addArgumentResolvers 로 넣은 리졸버는 기본 목록에서 Payload 리졸버 바로 앞에 끼워 넣어진다.
     * 그래서 @AuthenticationPrincipal Users 는 JSON 본문이 아니라 STOMP 세션 principal 로만 채운다.
     */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new StompAuthenticationPrincipalArgumentResolver());
    }
}
