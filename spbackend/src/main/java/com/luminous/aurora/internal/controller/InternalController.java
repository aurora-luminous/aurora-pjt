package com.luminous.aurora.internal.controller;


import com.luminous.aurora.chat.service.ChatService;
import com.luminous.aurora.common.error.exception.BadRequestException;
import com.luminous.aurora.internal.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/jv/internal")
@RequiredArgsConstructor
public class InternalController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    /**
     * Express에서 멤버 변경 시 호출하는 API
     * Express에서 채널 멤버 변경 시 호출, channelPks 제외하고 프론트에 브로드캐스트
     */
    @PostMapping("/member/notify")
    public ResponseEntity<String> notifyMemberChange(@RequestBody MemberChangeEvent event) {
        // 채널 멤버 변경만 처리
        if (event.getChannelPks() == null) {
            throw new BadRequestException("채널 정보가 필요합니다.");
        }

        // channelPks 제외하고 브로드 캐스트용 객체로 변환
        ChannelMemberBroadcast broadcast = ChannelMemberBroadcast.builder()
                .eventType(event.getEventType())
                .userName(event.getUserName())
                .userEmail(event.getUserEmail())
                .profileImagePath(event.getProfileImagePath())
                .build();

        for (Integer channelPk : event.getChannelPks()) {
            String destination = "/topic/channel/" + channelPk + "/members";
            messagingTemplate.convertAndSend(destination, broadcast);
        }


        log.info("채널 멤버 변경 알림 전송: eventType={}, channelPks = {}, userEmail = {}",
                event.getEventType(), event.getChannelPks(), event.getUserEmail());

        return ResponseEntity.ok("알림 전송 완료");

    }

    /**
     * Express에서 채널 정보 변경 시 호출하는 API
     * Express에서 채널 정보 변경 시 호출, projectPk 제외하고 프론트에 브로드캐스트
     */
    @PostMapping("/channel/notify")
    public ResponseEntity<String> notifyChannelChange(@RequestBody ChannelChangeEvent event) {

        if (event.getChannelPk() == null) {
            throw new BadRequestException("채널 정보가 필요합니다.");
        }
        if (event.getProjectPk() == null) {
            throw new BadRequestException("프로젝트 정보가 필요합니다.");
        }

        ChannelChangeBroadCast broadCast = ChannelChangeBroadCast.builder()
                .eventType(event.getEventType())
                .channelPk(event.getChannelPk())
                .channelName(event.getChannelName())
                .build();

        String destination = "/topic/project/" + event.getProjectPk() + "/notify";
        messagingTemplate.convertAndSend(destination, broadCast);

        log.info("채널 정보 변경 알림 전송 : eventType = {}, channelPk = {}, channelName = {}",
                event.getEventType(), event.getChannelPk(), event.getChannelName());

        return ResponseEntity.ok("알림 전송 완료");
    }

    /**
     * Express에서 프로젝트 정보 변경 시 호출하는 API
     * Express에서 프로젝트 정보 변경 시 호출, ServerUrl 제외하고 프론트에 브로드캐스트
     */
    @PostMapping("/project/notify")
    public ResponseEntity<String> notifyProjectChange(@RequestBody ProjectChangeEvent event) {

        if (event.getProjectPk() == null) {
            throw new BadRequestException("프로젝트 정보가 필요합니다.");
        }

        if (event.getServerUrl() == null) {
            throw new BadRequestException("서버 정보가 필요합니다.");
        }

        ProjectChangeBroadCast broadCast = ProjectChangeBroadCast.builder()
                .eventType(event.getEventType())
                .projectPk(event.getProjectPk())
                .projectName(event.getProjectName())
                .build();

        String destination = "/topic/server/" + event.getServerUrl() + "/notify";
        messagingTemplate.convertAndSend(destination, broadCast);

        log.info("프로젝트 정보 변경 알림 전송 : eventType = {}, projectPk = {}, projectName = {}",
                event.getEventType(), event.getProjectPk(), event.getProjectName());

        return ResponseEntity.ok("알림 전송 완료");
    }

    /**
     * Express에서 채널 목록 조회 시 unread 상태 일괄 조회
     * <p>
     * 호출되는 곳:
     * - Express 서버 → 채널 목록 API에서 Spring에 일괄 요청
     * <p>
     * 처리 순서:
     * 1. Express에서 채널 PK 목록 + userPk 전달
     * 2. ChatService.getChannelsUnreadStatus로 각 채널별 hasUnread 계산
     * 3. 결과를 Express에 반환 → Express가 채널 목록과 합쳐서 프론트에 내려줌
     * <p>
     * 요청 예시:
     * { "channelPks": [1, 3, 5], "userPk": 7 }
     * <p>
     * 응답 예시:
     * [
     * { "channelPk": 1, "hasUnread": true },
     * { "channelPk": 3, "hasUnread": false },
     * { "channelPk": 5, "hasUnread": true }
     * ]
     */
    @PostMapping("/channels/unread")
    public ResponseEntity<List<ChannelUnreadResponse>> getChannelsUnreadStatus(
            @RequestBody ChannelUnreadRequest request) {

        if (request.getChannelPks() == null || request.getUserPk() == null) {
            throw new BadRequestException("채널 목록과 사용자 정보가 필요합니다.");
        }

        List<ChannelUnreadResponse> response = chatService.getChannelsUnreadStatus(
                request.getChannelPks(), request.getUserPk());

        return ResponseEntity.ok(response);
    }
}
