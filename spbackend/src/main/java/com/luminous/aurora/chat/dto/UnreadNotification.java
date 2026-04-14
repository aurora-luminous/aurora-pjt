package com.luminous.aurora.chat.dto;

import lombok.*;

/**
 * 채널 메시지 unread 알림 DTO
 *
 * 채널에 새 메시지 발생 시 /topic/project/{projectPk}/unread로 브로드캐스트.
 * 프론트 사이드바에서 채널 unread 뱃지 업데이트에 사용.
 *
 * DM은 /topic/user/{userEmail}/dm으로 메시지 자체가 전달되므로
 * 별도 unread 알림이 불필요하여 dmRoomPk 필드를 제거함.
 */
@Builder
@Getter
public class UnreadNotification {
    private Integer channelPk;
    private String sendUserEmail;
}
