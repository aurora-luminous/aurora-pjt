package com.luminous.aurora.internal.controller;


import com.luminous.aurora.common.error.exception.BadRequestException;
import com.luminous.aurora.userstate.dto.MemberChangeEvent;
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
     * Express에서 받은 MemberChangeEvent를 그대로 다시 프론트에게 전달
     */
    @PostMapping("/member/notify")
    public ResponseEntity<String> notifyMemberChange(@RequestBody MemberChangeEvent event) {
        // 프로젝트 멤버 변경만 처리
        if (event.getProjectPk() == null) {
            throw new BadRequestException("프로젝트 정보가 필요합니다.");
        }

        String destination = "/topic/project/" + event.getProjectPk() + "/members";

        // WebSocket으로 가공없이 브로드캐스트
        messagingTemplate.convertAndSend(destination, event);

        log.info("프로젝트 멤버 변경 알림 전송: eventType={}, projectPk={}, userPk={}",
                event.getEventType(), event.getProjectPk(), event.getUserPk());

        return ResponseEntity.ok("알림 전송 완료");

    }
}
