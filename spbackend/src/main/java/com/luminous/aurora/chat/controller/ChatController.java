package com.luminous.aurora.chat.controller;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.chat.dto.MessageListResponse;
import com.luminous.aurora.chat.dto.MessagesOnlyResponse;
import com.luminous.aurora.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * 메시지 조회 REST API 컨트롤러
 * <p>
 * 채널/DM 메시지 목록을 조회하는 REST API.
 * 최신·around·newer 등은 {@link MessageListResponse}(읽음 위치 + 목록),
 * 과거 무한 스크롤용 {@code .../messages/older} 는 {@link MessagesOnlyResponse}(목록만)을 반환한다.
 */
@Slf4j
@RestController
@RequestMapping("/api/jv/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * 채널 최신 메시지 조회 (채널 입장 시)
     * GET /api/jv/chat/channel/{channelPk}/messages
     */
    @GetMapping("/channel/{channelPk}/messages")
    public ResponseEntity<MessageListResponse> getLatestChannelMessages(@PathVariable Integer channelPk,
                                                                        @AuthenticationPrincipal Users user) {
        MessageListResponse response = chatService.getLatestMessage(channelPk, user.getUserPk());
        log.info("채널 최신 메시지 조회 성공: channelPk={}, messageCount={}", channelPk, response.getMessages().size());
        return ResponseEntity.ok(response);
    }

    /**
     * 채널 이전 메시지 조회 (무한스크롤)
     * GET /api/jv/chat/channel/{channelPk}/messages/older
     */
    @GetMapping("/channel/{channelPk}/messages/older")
    public ResponseEntity<MessagesOnlyResponse> getOlderChannelMessages(@PathVariable Integer channelPk,
                                                                        @RequestParam LocalDateTime lastMessageTime,
                                                                        @AuthenticationPrincipal Users user) {
        MessagesOnlyResponse response = chatService.getOlderMessage(channelPk, lastMessageTime, user.getUserPk());
        log.info("채널 이전 메시지 조회 성공: channelPk={}, messageCount={}, lastMessageTime={}", channelPk, response.getMessages().size(), lastMessageTime);
        return ResponseEntity.ok(response);
    }

    /**
     * 채널 around 메시지 조회
     * GET /api/jv/chat/channel/{channelPk}/messages/around
     */
    @GetMapping("/channel/{channelPk}/messages/around")
    public ResponseEntity<MessageListResponse> getAroundChannelMessages(@PathVariable Integer channelPk,
                                                                        @RequestParam Long messagePk,
                                                                        @AuthenticationPrincipal Users user) {
        MessageListResponse response = chatService.getAroundMessage(channelPk, messagePk, user.getUserPk());
        log.info("채널 around 메시지 조회: channelPk = {}, messagePk = {}, count = {}",
                channelPk, messagePk, response.getMessages().size());
        return ResponseEntity.ok(response);
    }

    /**
     * 채널 newer 메시지 조회 (messagePk 이후 최대 40개)
     * GET /api/jv/chat/channel/{channelPk}/messages/newer?messagePk=
     */
    @GetMapping("/channel/{channelPk}/messages/newer")
    public ResponseEntity<MessageListResponse> getNewerChannelMessages(@PathVariable Integer channelPk,
                                                                       @RequestParam Long messagePk,
                                                                       @AuthenticationPrincipal Users user) {
        MessageListResponse response = chatService.getNewerMessage(channelPk, messagePk, user.getUserPk());
        log.info("채널 newer 메시지 조회: channelPk = {}, messagePk = {}, count = {}", channelPk, messagePk, response.getMessages().size());
        return ResponseEntity.ok(response);
    }

    /**
     * DM방 최신 메시지 조회 (DM방 입장 시)
     * GET /api/jv/chat/dm/{dmRoomPk}/messages
     */
    @GetMapping("/dm/{dmRoomPk}/messages")
    public ResponseEntity<MessageListResponse> getLatestDmMessages(@PathVariable Integer dmRoomPk,
                                                                   @AuthenticationPrincipal Users user) {
        MessageListResponse response = chatService.getLatestDmMessage(dmRoomPk, user.getUserPk());
        log.info("DM방 최신 메시지 조회 성공: dmRoomPk={}, messageCount={}", dmRoomPk, response.getMessages().size());
        return ResponseEntity.ok(response);
    }

    /**
     * DM방 이전 메시지 조회 (무한스크롤)
     * GET /api/jv/chat/dm/{dmRoomPk}/messages/older
     */
    @GetMapping("/dm/{dmRoomPk}/messages/older")
    public ResponseEntity<MessagesOnlyResponse> getOlderDmMessages(@PathVariable Integer dmRoomPk,
                                                                   @RequestParam LocalDateTime lastMessageTime,
                                                                   @AuthenticationPrincipal Users user) {
        MessagesOnlyResponse response = chatService.getOlderDmMessage(dmRoomPk, lastMessageTime, user.getUserPk());
        log.info("DM방 이전 메시지 조회 성공: dmRoomPk={}, messageCount={}, lastMessageTime={}", dmRoomPk, response.getMessages().size(), lastMessageTime);
        return ResponseEntity.ok(response);
    }

    /**
     * DM around 메시지 조회
     * GET /api/jv/chat/dm/{dmRoomPk}/messages/around?messagePk=
     */
    @GetMapping("/dm/{dmRoomPk}/messages/around")
    public ResponseEntity<MessageListResponse> getAroundDmMessages(@PathVariable Integer dmRoomPk,
                                                                   @RequestParam Long messagePk,
                                                                   @AuthenticationPrincipal Users user) {
        MessageListResponse response = chatService.getAroundDmMessage(dmRoomPk, messagePk, user.getUserPk());
        log.info("DM around 메시지 조회 성공: dmRoomPk = {}, messagePk = {}, count = {}", dmRoomPk, messagePk, response.getMessages().size());
        return ResponseEntity.ok(response);
    }

    /**
     * DM newer 메시지 조회 (messagePk 이후 최대 40개)
     * GET /api/jv/chat/dm/{dmRoomPk}/messages/newer?messagePk=
     */
    @GetMapping("/dm/{dmRoomPk}/messages/newer")
    public ResponseEntity<MessageListResponse> getNewerDmMessages(@PathVariable Integer dmRoomPk,
                                                                  @RequestParam Long messagePk,
                                                                  @AuthenticationPrincipal Users user) {
        MessageListResponse response = chatService.getNewerDmMessage(dmRoomPk, messagePk, user.getUserPk());
        log.info("DM newer 메시지 조회: dmRoomPk = {}, messagePk = {}, count = {}", dmRoomPk, messagePk, response.getMessages().size());
        return ResponseEntity.ok(response);
    }
}
