package com.luminous.aurora.internal.controller;


import com.luminous.aurora.common.error.exception.BadRequestException;
import com.luminous.aurora.internal.dto.ChannelChangeBroadCast;
import com.luminous.aurora.internal.dto.ChannelChangeEvent;
import com.luminous.aurora.internal.dto.ChannelMemberBroadcast;
import com.luminous.aurora.internal.dto.MemberChangeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("api/jv/internal")
@RequiredArgsConstructor
public class InternalController {

    private final SimpMessagingTemplate messagingTemplate;

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
}
