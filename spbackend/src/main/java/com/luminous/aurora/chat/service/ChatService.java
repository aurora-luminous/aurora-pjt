package com.luminous.aurora.chat.service;

import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.entity.Message;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatService {

    // 메시지 저장
    Message saveMessage(MessageRequest request, String jwtToken);

    // 채널별 최신 메시지 조회 (최초 로드 시)
    List<MessageResponse> getLatestMessage(Integer channelPk, String jwtToken);

    // 채널별 이전 메시지 조회 (스크롤 시)
    List<MessageResponse> getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, String jwtToken);

    // DM 방별 최신 메시지 조회
    List<MessageResponse> getLatestDmMessage(Integer dmRoomPk, String jwtToken);

    // DM 방별 이전 메시지 조회 (스크롤 시)
    List<MessageResponse> getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, String jwtToken);

    // Message 엔티티를 ChatMessage로 변환 (WebSocket용)
    ChatMessage convertToChatMessage(Message message);
}
