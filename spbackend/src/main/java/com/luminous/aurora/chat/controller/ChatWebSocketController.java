package com.luminous.aurora.chat.controller;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.ReadRequest;
import com.luminous.aurora.chat.dto.UnreadNotification;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.service.ChatService;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.userstate.dto.UserStatusChangeRequest;
import com.luminous.aurora.userstate.dto.UserStatusChangeResponse;
import com.luminous.aurora.userstate.service.UserStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
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
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserStateService userStateService;

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

            Message savedMessage = chatService.saveMessage(messageRequest, jwtToken);

            ChatMessage chatMessage = chatService.convertToChatMessage(savedMessage);

            // 프로젝트 unread 알림 브로드캐스트
            Integer projectPk = savedMessage.getChannelPk().getProject().getProjectPk();
            UnreadNotification notification = UnreadNotification.builder()
                    .channelPk(channelPk)
                    .sendUserEmail(savedMessage.getUserPk().getUserEmail())
                    .build();

            messagingTemplate.convertAndSend("/topic/project/" + projectPk + "/unread", notification);

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
            Message savedMessage = chatService.saveMessage(messageRequest, jwtToken);

            ChatMessage chatMessage = chatService.convertToChatMessage(savedMessage);

            // DM 방의 멤버에게 메시지 전송
            String destination = "/topic/dm/" + messageRequest.getDmRoomPk();
            messagingTemplate.convertAndSend(destination, chatMessage);

            log.info("DM 메시지 전송: DmRoomPk = {}, userPk ={}", messageRequest.getDmRoomPk(), chatMessage.getUserPk());

        } catch (Exception e) {
            log.error("DM 메시지 전송 실패 : {}", e.getMessage());
            throw new RuntimeException("메시지 전송에 실패했습니다:" + e.getMessage());
        }
    }

    /**
     * 채널 메시지 읽음 처리
     * <p>
     * 프론트에서 호출하는 시점:
     * - 채팅방 입장 시 (현재 마지막 메시지 PK 전송)
     * - 채팅방에 포커스된 상태에서 새 메시지 수신 시 (debounce 적용 권장)
     * - 채팅방 퇴장 시 (마지막으로 본 메시지 PK 전송)
     * <p>
     * 요청: /app/chat/channel/{channelPk}/read
     * Payload: { "messagePk": 123 }
     */
    @MessageMapping("/chat/channel/{channelPk}/read")
    public void markChannelAsRead(@Payload ReadRequest readRequest,
                                  @DestinationVariable Integer channelPk,
                                  SimpMessageHeaderAccessor headerAccessor) {
        try {
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }

            chatService.markChannelAsRead(channelPk, readRequest.getMessagePk(), jwtToken);
        } catch (Exception e) {
            log.error("채널 읽음 처리 실패: channelPk={}, {}", channelPk, e.getMessage());
        }
    }

    /**
     * DM 메시지 읽음 처리
     * <p>
     * 프론트에서 호출하는 시점:
     * - DM방 입장 시 (현재 마지막 메시지 PK 전송)
     * - DM방에 포커스된 상태에서 새 메시지 수신 시 (debounce 적용 권장)
     * - DM방 퇴장 시 (마지막으로 본 메시지 PK 전송)
     * <p>
     * 요청: /app/chat/dm/{dmRoomPk}/read
     * Payload: { "messagePk": 123 }
     * <p>
     * 연관 기능:
     * - DM 목록 조회 시 unreadCount 계산에 반영
     * (UserStateServiceImpl.getDmRoomsWithStatus → countUnreadMessages)
     */
    @MessageMapping("/chat/dm/{dmRoomPk}/read")
    public void markDmAsRead(@Payload ReadRequest readRequest,
                             @DestinationVariable Integer dmRoomPk,
                             SimpMessageHeaderAccessor headerAccessor) {
        try {
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }

            chatService.markDmAsRead(dmRoomPk, readRequest.getMessagePk(), jwtToken);

        } catch (Exception e) {
            log.error("DM 읽음 처리 실패: dmRoomPk={}, {}", dmRoomPk, e.getMessage());
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

    /**
     * 사용자 상태 변경 요청 처리
     */
    @MessageMapping("/userstate/change")
    public void changeUserStatus(@Payload UserStatusChangeRequest request,
                                 SimpMessageHeaderAccessor headerAccessor) {
        Integer userPk = null;
        try {
            // JWT 토큰 검증 및 userPk 추출
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }

            userPk = extractUserPkFromToken(jwtToken);

            // 상태 변경
            userStateService.setUserStatus(userPk, request.getStatus());

            // 상태 변경 응답 생성
            UserStatusChangeResponse response = UserStatusChangeResponse.builder()
                    .userPk(userPk)
                    .status(request.getStatus())
                    .timestamp(System.currentTimeMillis())
                    .build();

            // 브로드캐스트
            if (request.getProjectPk() != null) {
                String projectDestination = "/topic/project/" + request.getProjectPk() + "/userstate";
                messagingTemplate.convertAndSend(projectDestination, response);
                log.info("프로젝트 상태 변경 브로드캐스트: projectPk={}, userPk={}, status={}",
                        request.getProjectPk(), userPk, request.getStatus());
            }

            if (request.getDmRoomPk() != null) {
                String dmDestination = "/topic/dm/" + request.getDmRoomPk() + "/userstate";
                messagingTemplate.convertAndSend(dmDestination, response);
                log.info("DM 상태 변경 브로드캐스트: dmRoomPk={}, userPk={}, status={}",
                        request.getDmRoomPk(), userPk, request.getStatus());
            }

        } catch (Exception e) {
            log.error("사용자 상태 변경 실패: userPk={}, status={}",
                    userPk, request.getStatus(), e);
        }
    }

    /**
     * 비활동 감지 (프론트에서 x분 비활동시 호출)
     */
    @MessageMapping("/userstate/away")
    public void setAutoAway(SimpMessageHeaderAccessor headerAccessor) {
        try {
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }
            Integer userPk = extractUserPkFromToken(jwtToken);
            userStateService.setUserAway(userPk);

            log.info("자동 자리 비움 설정");
        } catch (Exception e) {
            log.error("자동 자리비움 설정 실패 : {}", e.getMessage());
        }
    }

    /**
     * 활동 감지 (프론트에서 마우스/키보드 움직임 감지 시 호출)
     */
    @MessageMapping("/userstate/active")
    public void setActive(SimpMessageHeaderAccessor headerAccessor) {
        try {
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }

            Integer userPk = extractUserPkFromToken(jwtToken);
            userStateService.setUserOnline(userPk);

            log.info("활동 재개");
        } catch (Exception e) {
            log.error("활동 재개 설정 실패 : {}", e.getMessage());
        }
    }

}
