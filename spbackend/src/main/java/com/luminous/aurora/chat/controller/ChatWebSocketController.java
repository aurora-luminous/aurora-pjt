package com.luminous.aurora.chat.controller;

import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // 채널 메시지 전송
    @MessageMapping("/chat/channel")
    @SendTo("/topic/channel/{channelPk}")
    public ChatMessage sendChannelMessage(@Payload MessageRequest messageRequest,
                                          SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 세션에서 JWT 토큰 추출
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }
            Message savedMessage = chatService.saveMessage(messageRequest, jwtToken);
            ChatMessage chatMessage = chatService.convertToChatMessage(savedMessage);

            log.info("채널 메시지 전송 : channelPk = {}, userPk ={}", messageRequest.getChannelPk(), savedMessage.getUserPk());

            return chatMessage;
        } catch (Exception e) {
            log.error("채널 메시지 전송 실패: {}", e.getMessage());
            throw new RuntimeException("메시지 전송에 실패했습니다 :" + e.getMessage());
        }
    }

    // DM 메시지 전송
    @MessageMapping("/chat/dm")
    public void sendDmMessage(@Payload MessageRequest messageRequest,
                              SimpMessageHeaderAccessor headerAccessor) {
        try {
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }
            // 메시지 저장 및 chatMessage로 변환
            Message savedMessage = chatService.saveMessage(messageRequest, jwtToken);
            ChatMessage chatMessage = chatService.convertToChatMessage(savedMessage);

            // DM 방의 멤버에게 메시지 전송
            String destination = "/topic/dm/" + messageRequest.getDmRoomPk();
            messagingTemplate.convertAndSend(destination, chatMessage);

            log.info("DM 메시지 전송: DmRoomPk = {}, userPk ={}", messageRequest.getDmRoomPk(), savedMessage.getUserPk());

        } catch (Exception e) {
            log.error("DM 메시지 전송 실패 : {}", e.getMessage());
            throw new RuntimeException("메시지 전송에 실패했습니다:" + e.getMessage());
        }
    }

    // 세션에서 JWT 토큰 추출
    private String extractJwtFromSession(SimpMessageHeaderAccessor headerAccessor) {
        return (String) headerAccessor.getSessionAttributes().get("jwt_token");
    }
}
