package com.luminous.aurora.chat.service;

import com.luminous.aurora.chat.dto.MessageListResponse;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.dto.MessagesOnlyResponse;
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
     * @param userPk 메시지를 보낸 사용자 PK
     */
    Message saveChannelMessage(MessageRequest request,Integer channelPk, Integer userPk);

    /**
     * DM 메시지 저장
     * @param request 메시지 내용 (content, messageType)
     * @param dmRoomPk 대상 DM방 Pk
     * @param userPk 메시지를 보낸 사용자 PK
     */
    Message saveDmMessage(MessageRequest request, Integer dmRoomPk, Integer userPk);


    // 채널별 최신 메시지 조회 (최초 로드 시)
    MessageListResponse getLatestMessage(Integer channelPk, Integer userPk);

    // 채널별 이전 메시지 조회 (스크롤 시)
    MessagesOnlyResponse getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, Integer userPk);

    // 채널: 기준 messagePk 주변 메시지 조회 (이전 20 + 기준 + 이후 20, 최대 41개)
    MessageListResponse getAroundMessage(Integer channelPk, Long messagePk, Integer userPk);

    // 채널: 기준 messagePk 보다 이후에 온 메시지 40개 오름차순(newer 전용), 기준 메시지 미포함
    MessageListResponse getNewerMessage(Integer channelPk, Long afterMessagePk, Integer userPk);

    // DM 방별 최신 메시지 조회
    MessageListResponse getLatestDmMessage(Integer dmRoomPk, Integer userPk);

    // DM 방별 이전 메시지 조회 (스크롤 시)
    MessagesOnlyResponse getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, Integer userPk);

    // DM : 기준 messagePk 주변 메시지 조회 (이전 20 + 기준 + 이후 20, 최대 41개)
    MessageListResponse getAroundDmMessage(Integer dmRoomPk, Long messagePk, Integer userPk);

    // DM : 기준 messagePk 보다 이후에 온 메시지 40개 오름차순(newer 전용), 기준 메시지 미포함
    MessageListResponse getNewerDmMessage(Integer dmRoomPk, Long afterMessagePk, Integer userPk);

    // 채널 안읽은 메시지 표시용
    void markChannelAsRead(Integer channelPk, Long messagePk, Integer userPk);

    // 여러 채널의 안 읽은 메시지 존재 여부 일괄 조회
    List<ChannelUnreadResponse> getChannelsUnreadStatus(List<Integer> channelPks, Integer userPk);

    // DM 안읽은 메시지 표시
    void markDmAsRead(Integer dmRoomPk, Long messagePk, Integer userPk);

    MessageResponse convertToMessageResponse(Message message);

}
