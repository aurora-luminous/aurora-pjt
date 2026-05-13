package com.luminous.aurora.chat.controller;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.dto.ReadRequest;
import com.luminous.aurora.chat.dto.UnreadNotification;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.service.ChatService;
import com.luminous.aurora.common.error.exception.UnauthorizedException;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * STOMP 메시지 핸들러.
 * <p>
 * 사용자 식별은 예전 세션 {@code jwt_token} 저장 방식이 아니라,
 * STOMP {@code CONNECT} 시 {@link com.luminous.aurora.config.StompAuthChannelInterceptor}가
 * 세션에 세팅한 {@link org.springframework.security.core.Authentication}의 principal
 * ({@link Users})를 {@link AuthenticationPrincipal}로 주입받는다.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserStateService userStateService;
    private final DmMemberRepository dmMemberRepository;

    private static Integer requireUserPk(Users user) {
        if (user == null) {
            throw new UnauthorizedException("인증 정보를 찾을 수 없습니다.");
        }

        return user.getUserPk();
    }

    /**
     * 채널 메시지 전송
     * <p>
     * 프론트에서 /app/chat/channel/{channelPk}로 메시지를 보내면
     * 1. DB에 메시지 저장
     * 2. MessageResponse로 변환해 /topic/channel/{channelPk} 구독자에게 브로드캐스트
     * 3. 프로젝트 멤버 전원에게 unread 알림 전송 (/topic/project/{projectPk}/unread)
     *
     * @return MessageResponse - @SendTo에 의해 /topic/channel/{channelPk}로 브로드캐스트
     */
    @MessageMapping("/chat/channel/{channelPk}")
    @SendTo("/topic/channel/{channelPk}")
    public MessageResponse sendChannelMessage(@Payload MessageRequest messageRequest,
                                              @DestinationVariable Integer channelPk,
                                              @AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
            Message savedMessage = chatService.saveChannelMessage(messageRequest, channelPk, userPk);

            // ChatMessage 대신 통합된 MessageResponse 사용
            MessageResponse messageResponse = chatService.convertToMessageResponse(savedMessage);

            // 프로젝트 멤버 전원에게 unread 알림 브로드캐스트
            // 사이드바에서 현재 보고 있지 않는 채널의 뱃지 업데이트용
            Integer projectPk = savedMessage.getChannelPk().getProject().getProjectPk();
            UnreadNotification notification = UnreadNotification.builder()
                    .channelPk(channelPk)
                    .sendUserEmail(savedMessage.getUserPk().getUserEmail())
                    .build();

            messagingTemplate.convertAndSend("/topic/project/" + projectPk + "/unread", notification);

            log.info("채널 메시지 전송 : channelPk = {}, userEmail ={}", channelPk, messageResponse.getUserEmail());

            return messageResponse;
        } catch (Exception e) {
            log.error("채널 메시지 전송 실패: {}", e.getMessage());
            throw new RuntimeException("메시지 전송에 실패했습니다 :" + e.getMessage());
        }
    }

    /**
     * DM 메시지 전송 (WebSocket)
     * <p>
     * 프론트 요청: /app/chat/dm/{dmRoomPk}
     * Payload: { "content": "...", "messageType": "TEXT" }
     * <p>
     * 처리 순서:
     * 1. STOMP 세션 Principal({@link Users})로 발신자 식별
     * 2. 메시지 저장 (ChatService.saveDmMessage)
     * 3. Message → MessageResponse DTO 변환
     * 4. DM방 존재 검증 (멤버 조회)
     * 5. DM방 멤버 전원의 유저 토픽으로 각각 전송
     * <p>
     * 브로드캐스트 방식:
     * - /topic/user/{userEmail}/dm 으로 멤버별 개별 전송
     * - 본인 포함 전원에게 전송 (프론트에서 본인 메시지 렌더링에 활용)
     * - 메시지 수신 자체가 unread 알림 역할 → 별도 unread 알림 불필요
     * <p>
     * 구독: /topic/user/{userEmail}/dm (로그인 시 1회 구독)
     */
    @MessageMapping("/chat/dm/{dmRoomPk}")
    public void sendDmMessage(@Payload MessageRequest messageRequest,
                              @DestinationVariable Integer dmRoomPk,
                              @AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
            // 메시지 저장 및 chatMessage로 변환
            Message savedMessage = chatService.saveDmMessage(messageRequest, dmRoomPk, userPk);

            // ChatMessage 대신 통합된 MessageResponse 사용
            MessageResponse messageResponse = chatService.convertToMessageResponse(savedMessage);

            // DM 방의 멤버각각의 user 레벨 토픽으로 메시지 전송
            List<DmMember> dmMembers = dmMemberRepository.findByDmRoom_DmRoomPk(dmRoomPk);
            // DM 방 멤버 조회 (존재 검증 겸용)
            if (dmMembers.isEmpty()) {
                throw new RuntimeException("존재하지 않는 DM방 입니다.");
            }
            dmMembers.forEach(m ->
                    messagingTemplate.convertAndSend(
                            "/topic/user/" + m.getUser().getUserEmail() + "/dm",
                            messageResponse
                    ));

            log.info("DM 메시지 전송: DmRoomPk = {}, userEmail ={}", dmRoomPk, messageResponse.getUserEmail());

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
                                  @AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
            chatService.markChannelAsRead(channelPk, readRequest.getMessagePk(), userPk);
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
                             @AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
            chatService.markDmAsRead(dmRoomPk, readRequest.getMessagePk(), userPk);

        } catch (Exception e) {
            log.error("DM 읽음 처리 실패: dmRoomPk={}, {}", dmRoomPk, e.getMessage());
        }
    }

    /**
     * 사용자 상태 변경 요청 처리
     */
    @MessageMapping("/userstate/change")
    public void changeUserStatus(@Payload UserStatusChangeRequest request,
                                 @AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
            String userEmail = user.getUserEmail();

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
                    user != null ? user.getUserEmail() : null, request.getStatus(), e);
        }
    }

    /**
     * 비활동 감지 (프론트에서 x분 비활동시 호출)
     */
    @MessageMapping("/userstate/away")
    public void setAutoAway(@AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
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
    public void setActive(@AuthenticationPrincipal Users user) {
        try {
            Integer userPk = requireUserPk(user);
            userStateService.setUserOnline(userPk);

            log.info("활동 재개");
        } catch (Exception e) {
            log.error("활동 재개 설정 실패 : {}", e.getMessage());
        }
    }

}
