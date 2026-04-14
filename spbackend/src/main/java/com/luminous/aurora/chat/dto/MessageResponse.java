package com.luminous.aurora.chat.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 메시지 응답 DTO (REST API + WebSocket 공용)
 *
 * 채널/DM 메시지 조회(REST) 및 실시간 메시지 브로드캐스트(WebSocket) 모두에서 사용.
 * 프론트에서 메시지를 렌더링하는 데 필요한 최소 정보를 포함함.
 *
 * - userEmail: 보안상 userPk 대신 사용. 프론트에서 "내 메시지" 판별에도 활용
 * - userProfileImage: 채팅 UI에서 프로필 이미지 표시용
 * - channelPk/dmRoomPk는 제거됨 (REST는 URL PathVariable로, WebSocket은 구독 토픽으로 이미 알 수 있음)
 */
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long messagePk;
    private String userEmail;
    private String userName;
    private String userProfileImage;
    private String content;
    private LocalDateTime createdAt;
    private String messageType;
}
