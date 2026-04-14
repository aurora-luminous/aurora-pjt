package com.luminous.aurora.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 메시지 목록 조회 REST API 응답 DTO
 *
 * 메시지 목록과 함께 사용자의 마지막 읽음 위치(LastReadMessagePk)를 포함
 * 프론트에서 "--- 여기까지 읽었습니다 ---" 디바이더를 표시하는 데 사용.
 *
 * lastREadMessagePk : 현재 사용자가 마지막으로 읽은 메시지 PK(null 이면 읽은 적 없음)
 * - messages : 조회된 메시지 목록
 */
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MessageListResponse {
    private Long lastReadMessagePk;
    private List<MessageResponse> messages;

}
