package com.luminous.aurora.chat.service;

import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.internal.dto.ChannelUnreadResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatService {

    /**
     * 채널 메시지 저장
     *
     * @param request 메시지 내용 (content, messageType)
     * @param channelPk 대상 채널 Pk
     * @param jwtToken 사용자 인증 토큰
     */
    Message saveChannelMessage(MessageRequest request,Integer channelPk, String jwtToken);

    /**
     * DM 메시지 저장
     * @param request 메시지 내용 (content, messageType)
     * @param dmRoomPk 대상 DM방 Pk
     * @param jwtToken 사용자 인증 토큰
     */
    Message saveDmMessage(MessageRequest request, Integer dmRoomPk, String jwtToken);


    // 채널별 최신 메시지 조회 (최초 로드 시)
    List<MessageResponse> getLatestMessage(Integer channelPk, String jwtToken);

    // 채널별 이전 메시지 조회 (스크롤 시)
    List<MessageResponse> getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, String jwtToken);

    // DM 방별 최신 메시지 조회
    List<MessageResponse> getLatestDmMessage(Integer dmRoomPk, String jwtToken);

    // DM 방별 이전 메시지 조회 (스크롤 시)
    List<MessageResponse> getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, String jwtToken);

    // 채널 안읽은 메시지 표시용
    void markChannelAsRead(Integer channelPk, Long messagePk, String jwtToken);

    // 여러 채널의 안 읽은 메시지 존재 여부 일괄 조회
    List<ChannelUnreadResponse> getChannelsUnreadStatus(List<Integer> channelPks, Integer userPk);

    // DM 안읽은 메시지 표시
    void markDmAsRead(Integer dmRoomPk, Long messagePk, String jwtToken);

    MessageResponse convertToMessageResponse(Message message);

}
