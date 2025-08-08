package com.luminous.aurora.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public void configureMessageBrocker(MessageBrokerRegistry config) {
        // 클라이언트가 서버로 메시지를 보낼 때 사용할 prefix
        config.setApplicationDestinationPrefixes("/app");

        // 서버가 클라이언트에게 메시지를 사용할 prefix
        config.enableSimpleBroker("/topic");
    }

    public void registerStompEndpoint(StompEndpointRegistry registry) {
        // Websocket 연결 엔드포인트
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "https://t1329.p.ssafy.io")
                .withSockJS();
    }

}
