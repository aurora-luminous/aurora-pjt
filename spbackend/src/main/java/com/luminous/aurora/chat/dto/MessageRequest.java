package com.luminous.aurora.chat.dto;


import lombok.*;

/**
 * 메시지 전송 요청 DTO
 *
 * WebSocket으로 메시지 전송 시 사용.
 * channelPk/dmRoomPk는 WebSocket 경로의 PathVariable로 전달되므로
 * Request body에는 포함하지 않음.
 * (예: /app/chat/channel/{channelPk}, /app/chat/dm/{dmRoomPk})
 */
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private String content;
    private String messageType;
}
