package com.luminous.aurora.chat.controller;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.service.ChatService;
import com.luminous.aurora.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    // 채널 메시지 전송
    @MessageMapping("/chat/channel/{channelPk}")
    @SendTo("/topic/channel/{channelPk}")
    public ChatMessage sendChannelMessage(@Payload MessageRequest messageRequest,
                                          @DestinationVariable Integer channelPk,
                                          SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 세션에서 JWT 토큰 추출
            // channelPk 검증
            if (!channelPk.equals(messageRequest.getChannelPk())) {
                throw new RuntimeException("경로의 채널과 요청의 채널이 일치하지 않습니다.");
            }
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");

            }
            chatService.saveMessage(messageRequest, jwtToken);
            ChatMessage chatMessage = ChatMessage.builder()
                    .channelPk(messageRequest.getChannelPk())
                    .dmRoomPk(messageRequest.getDmRoomPk())
                    .userPk(extractUserPkFromToken(jwtToken))  // JWT에서 userPk 추출 필요
                    .content(messageRequest.getContent())
                    .messageType(messageRequest.getMessageType() != null ? messageRequest.getMessageType() : "TEXT")
                    .createdAt(LocalDateTime.now())
                    .build();

            log.info("채널 메시지 전송 : channelPk = {}, userPk ={}", messageRequest.getChannelPk(), chatMessage.getUserPk());

            return chatMessage;
        } catch (Exception e) {
            log.error("채널 메시지 전송 실패: {}", e.getMessage());
            throw new RuntimeException("메시지 전송에 실패했습니다 :" + e.getMessage());
        }
    }

    // DM 메시지 전송
    @MessageMapping("/chat/dm/{dmRoomPk}")
    @SendTo("/topic/dm/{dmRoomPk}")
    public void sendDmMessage(@Payload MessageRequest messageRequest,
                              @DestinationVariable Integer dmRoomPk,
                              SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 경로의 dmRoomPk와 요청의 dmRoomPk 일치 검증
            if (!dmRoomPk.equals(messageRequest.getDmRoomPk())) {
                throw new RuntimeException("경로의 DM방과 요청의 DM방이 일치하지 않습니다.");
            }

            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }
            // 메시지 저장 및 chatMessage로 변환
            chatService.saveMessage(messageRequest, jwtToken);

            ChatMessage chatMessage = ChatMessage.builder()
                    .channelPk(messageRequest.getChannelPk())
                    .dmRoomPk(messageRequest.getDmRoomPk())
                    .userPk(extractUserPkFromToken(jwtToken))
                    .content(messageRequest.getContent())
                    .messageType(messageRequest.getMessageType() != null ? messageRequest.getMessageType() : "TEXT")
                    .createdAt(LocalDateTime.now())
                    .build();

            // DM 방의 멤버에게 메시지 전송
            String destination = "/topic/dm/" + messageRequest.getDmRoomPk();
            messagingTemplate.convertAndSend(destination, chatMessage);

            log.info("DM 메시지 전송: DmRoomPk = {}, userPk ={}", messageRequest.getDmRoomPk(), chatMessage.getUserPk());

        } catch (Exception e) {
            log.error("DM 메시지 전송 실패 : {}", e.getMessage());
            throw new RuntimeException("메시지 전송에 실패했습니다:" + e.getMessage());
        }
    }

    // 세션에서 JWT 토큰 추출
    private String extractJwtFromSession(SimpMessageHeaderAccessor headerAccessor) {
        return (String) headerAccessor.getSessionAttributes().get("jwt_token");
    }
    // JWT 토큰에서 userPk 추출
    private Integer extractUserPkFromToken(String jwtToken) {
        // JWT에서 userEmail 추출 후 userPk 조회
        String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
        return userRepository.findUserPkByUserEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }
}
