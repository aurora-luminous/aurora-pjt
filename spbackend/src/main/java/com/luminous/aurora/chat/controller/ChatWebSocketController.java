package com.luminous.aurora.chat.controller;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.ReadRequest;
import com.luminous.aurora.chat.dto.UnreadNotification;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.service.ChatService;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.member.repository.DmMemberRepository;
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

import java.util.List;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserStateService userStateService;
    private final DmMemberRepository dmMemberRepository;

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

    /**
     * DM 메시지 전송
     * <p>
     * 프론트 요청 : /app/chat/dm/{dmRoomPk}
     * Payload : { "channelPk": null, "dmRoomPk": 1, "content": "...", "messageType": "TEXT" }
     * <p>
     * 처리 순서
     * 1. 경로의 dmRommPk와 요청의 dmRoomPk 일치 검증
     * 2. JWT 토큰 추출 및 검증
     * 3. DM방 멤버 조회 (존재하지 않는 방이면 에러)
     * 4. 메시지 저장 (ChatService.saveMessage)
     * 5. Message -> ChatMessage DTO 변환
     * 6. DM 방 멤버 전원의 유저 토픽으로 각각 전송
     * <p>
     * 브로드 캐스트 방식:
     * - 유저 단위 토픽 /topic/user/{userEmail}/dm 으로 멤버별 개별 전송
     * - 본인 포함 전원에게 전송 (프론트에서 본인 메시지 렌더링에 활용)
     * - 프론트는 수신 메시지의 dmRoomPk로 어느 방인지 구분
     * - 현재 보고 있는 DM방이면 채팅창 렌더링, 아니면 안 읽음 표시
     * <p>
     * 구독 : /topic/user/{userEmail}/dm  (로그인 시 1회 구독)
     */
    @MessageMapping("/chat/dm/{dmRoomPk}")
    public void sendDmMessage(@Payload MessageRequest messageRequest,
                              @DestinationVariable Integer dmRoomPk,
                              SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 1. 경로의 dmRoomPk와 요청의 dmRoomPk 일치 검증
            if (!dmRoomPk.equals(messageRequest.getDmRoomPk())) {
                throw new RuntimeException("경로의 DM방과 요청의 DM방이 일치하지 않습니다.");
            }

            // 2. JWT 토큰 추출
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }
            // 3. DM 방 멤버 조회 (존재 검증 겸용)
            List<DmMember> dmMembers = dmMemberRepository.findByDmRoom_DmRoomPk(dmRoomPk);
            if (dmMembers.isEmpty()) {
                throw new RuntimeException("존재하지 않는 DM방 입니다.");
            }

            // 4. 메시지 저장
            Message savedMessage = chatService.saveMessage(messageRequest, jwtToken);

            // 5. Message -> ChatMessage DTO 변환
            ChatMessage chatMessage = chatService.convertToChatMessage(savedMessage);

            // 6. DM방 멤버 전원의 유저 토픽으로 각각 전송
            dmMembers.forEach(m -> {
                messagingTemplate.convertAndSend(
                        "/topic/user/" + m.getUser().getUserEmail() +"/dm",
                        chatMessage
                );
            });

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
        String userEmail = null;
        try {
            // JWT 토큰 검증 및 userPk 추출
            String jwtToken = extractJwtFromSession(headerAccessor);
            if (jwtToken == null) {
                throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
            }

            userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
            Integer userPk = extractUserPkFromToken(jwtToken);

            // 상태 변경
            userStateService.setUserStatus(userPk, request.getStatus());

            // 상태 변경 응답 생성
            UserStatusChangeResponse response = UserStatusChangeResponse.builder()
                    .userEmail(userEmail)
                    .status(request.getStatus())
                    .timestamp(System.currentTimeMillis())
                    .build();

            // 브로드캐스트
            if (request.getProjectPk() != null) {
                String projectDestination = "/topic/project/" + request.getProjectPk() + "/userstate";
                messagingTemplate.convertAndSend(projectDestination, response);
                log.info("프로젝트 상태 변경 브로드캐스트: projectPk={}, userEmail={}, status={}",
                        request.getProjectPk(), userEmail, request.getStatus());
            }

            if (request.getDmRoomPk() != null) {
                String dmDestination = "/topic/dm/" + request.getDmRoomPk() + "/userstate";
                messagingTemplate.convertAndSend(dmDestination, response);
                log.info("DM 상태 변경 브로드캐스트: dmRoomPk={}, userEmail={}, status={}",
                        request.getDmRoomPk(), userEmail, request.getStatus());
            }

        } catch (Exception e) {
            log.error("사용자 상태 변경 실패: userEmail={}, status={}",
                    userEmail, request.getStatus(), e);
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
