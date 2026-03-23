package com.luminous.aurora.chat.controller;

import com.luminous.aurora.chat.dto.ChannelUnreadResponse;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

// REST API용 컨트롤러
@Slf4j
@RestController
@RequestMapping("/api/jv/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // 채널 안읽은 메시지 존재 여부 조회
    @GetMapping("/channel/{channelPk}/unread")
    public ResponseEntity<ChannelUnreadResponse> getChannelUnreadStatus(
            @PathVariable Integer channelPk,
            @CookieValue("access_token") String jwtToken) {
        ChannelUnreadResponse response = chatService.getChannelUnreadStatus(channelPk,jwtToken);
        return ResponseEntity.ok(response);
    }

    // 채널 최신 메시지 조회 (최초 로드)
    @GetMapping("/channel/{channelPk}/messages")
    public ResponseEntity<List<MessageResponse>> getLatestChannelMessages(
            @PathVariable Integer channelPk,
            @CookieValue("access_token") String jwtToken) {
        List<MessageResponse> messages = chatService.getLatestMessage(channelPk, jwtToken);
        log.info("채널 최신 메시지 조회 성공: channelPk={}, messageCount={}",
                channelPk, messages.size());
        return ResponseEntity.ok(messages);
    }

    // 채널 이전 메시지 조회 (무한스크롤)
    @GetMapping("/channel/{channelPk}/messages/older")
    public ResponseEntity<List<MessageResponse>> getOlderChannelMessages(
            @PathVariable Integer channelPk,
            @RequestParam LocalDateTime lastMessageTime,
            @CookieValue("access_token") String jwtToken) {
        List<MessageResponse> messages = chatService.getOlderMessage(channelPk, lastMessageTime, jwtToken);
        log.info("채널 이전 메시지 조회 성공: channelPk={}, messageCount={}, lastMessageTime={}",
                channelPk, messages.size(), lastMessageTime);
        return ResponseEntity.ok(messages);
    }

    // DM방 최신 메시지 조회
    @GetMapping("/dm/{dmRoomPk}/messages")
    public ResponseEntity<List<MessageResponse>> getLatestDmMessages(
            @PathVariable Integer dmRoomPk,
            @CookieValue("access_token") String jwtToken) {
        List<MessageResponse> messages = chatService.getLatestDmMessage(dmRoomPk, jwtToken);
        log.info("DM방 최신 메시지 조회 성공: dmRoomPk={}, messageCount={}",
                dmRoomPk, messages.size());
        return ResponseEntity.ok(messages);
    }

    // DM방 이전 메시지 조회 (무한스크롤)
    @GetMapping("/dm/{dmRoomPk}/messages/older")
    public ResponseEntity<List<MessageResponse>> getOlderDmMessages(
            @PathVariable Integer dmRoomPk,
            @RequestParam LocalDateTime lastMessageTime,
            @CookieValue("access_token") String jwtToken) {
        List<MessageResponse> messages = chatService.getOlderDmMessage(dmRoomPk, lastMessageTime, jwtToken);
        log.info("DM방 이전 메시지 조회 성공: dmRoomPk={}, messageCount={}, lastMessageTime={}",
                dmRoomPk, messages.size(), lastMessageTime);
        return ResponseEntity.ok(messages);
    }
}
