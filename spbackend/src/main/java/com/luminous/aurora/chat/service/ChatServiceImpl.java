package com.luminous.aurora.chat.service;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.channel.entity.Channel;
import com.luminous.aurora.channel.repository.ChannelRepository;
import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.repository.MessageRepository;
import com.luminous.aurora.common.error.exception.BadRequestException;
import com.luminous.aurora.common.error.exception.ForbiddenException;
import com.luminous.aurora.common.error.exception.InternalServerErrorException;
import com.luminous.aurora.common.error.exception.NotFoundException;
import com.luminous.aurora.dmroom.entity.DmRoom;
import com.luminous.aurora.dmroom.repository.DmRoomRepository;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberService memberService;
    private final ChannelRepository channelRepository;
    private final DmRoomRepository dmRoomRepository;

    /**
     * 메시지를 DB에 저장
     *
     * @param request - 클라이언트가 보낸 메시지 정보 (channelPk/dmRoomPk, content, messageType)
     * @param jwtToken - 사용자 인증 토큰 (누가 보냈는지 확인용)
     *
     * <p>
     * 호출되는 곳:
     * - ChatWebSocketController.sendChannelMessage() → 채널 채팅 시
     * - ChatWebSocketController.sendDmMessage()      → DM 채팅 시
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널/DM방 접근 권한 검증
     * 3. Channel, DmRoom, Users 엔티티 조회
     * 4. Message 엔티티 생성 및 DB 저장
     */
    @Override
    @Transactional
    public Message saveMessage(MessageRequest request, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);

            boolean isChannelMessage = request.getChannelPk() != null;
            boolean isDmMessage = request.getDmRoomPk() != null;

            // 권한 검증
            if (isChannelMessage) {
                validateChannelAccess(request.getChannelPk(), userPk);
            } else {
                validateDmRoomAccess(request.getDmRoomPk(), userPk);
            }

            Channel channel = null;
            DmRoom dmRoom = null;

            if (request.getChannelPk() != null) {
                channel = channelRepository.findById(request.getChannelPk()).orElseThrow(() -> new NotFoundException("채널을 찾을 수 없습니다."));
            }
            if (request.getDmRoomPk() != null) {
                dmRoom = dmRoomRepository.findById(request.getDmRoomPk()).orElseThrow(() -> new NotFoundException("DM방을 찾을 수 없습니다."));
            }
            Users user = userRepository.findById(userPk).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

            Message message = Message.builder().channelPk(channel).dmRoomPk(dmRoom).userPk(user).content(request.getContent()).messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT").build();

            Message savedMessage = messageRepository.save(message);

            log.info("메세지 저장: channelPk = {}, userPk = {}", request.getChannelPk(), userPk);

            return savedMessage;
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("메시지 저장 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("메시지 저장 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    /**
     * 채널의 최신 메시지 20개 조회 (처음 채널 입장 시)
     *
     * @param channelPk - 조회할 채널 PK
     * @param jwtToken - 사용자 인증 토큰
     * @return List<MessageResponse> - 메시지 목록 (최신순, 최대 20개)
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/channel/{channelPk}/messages
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널 접근 권한 검증
     * 3. MessageRepository에서 최신 20개 조회
     * 4. Message → MessageResponse DTO 변환
     * <p>
     * 사용 시점: 사용자가 채널에 처음 들어갈 때
     */
    @Override
    public List<MessageResponse> getLatestMessage(Integer channelPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            List<Message> messages = messageRepository.findLatestMessagesByChannelPk(channelPk);

            return messages.stream().map(this::convertToMessageResponse).collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("최신 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("최신 메시지 조회 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    /**
     * 채널의 이전 메시지 20개 조회 (스크롤 위로 올릴 때)
     *
     * @param channelPk - 조회할 채널 PK
     * @param lastMessageTime - 현재 화면에서 가장 오래된 메시지의 시간
     * @param jwtToken - 사용자 인증 토큰
     * @return List<MessageResponse> - 이전 메시지 목록 (최대 20개)
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/channel/{channelPk}/messages/older
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널 접근 권한 검증
     * 3. lastMessageTime 이전의 메시지 20개 조회
     * 4. Message → MessageResponse DTO 변환
     * <p>
     * 사용 시점: 사용자가 채팅창을 위로 스크롤할 때 (무한 스크롤)
     */
    @Override
    public List<MessageResponse> getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            List<Message> messages = messageRepository.findOlderMessagesByChannelPk(channelPk, lastMessageTime);
            return messages.stream().map(this::convertToMessageResponse).collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("이전 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("이전 메시지 조회 중 서버 오류가 발생했습니다. " + e.getMessage());
        }
    }

    /**
     * DM방의 최신 메시지 20개 조회 (처음 DM방 입장 시)
     *
     * @param dmRoomPk - 조회할 DM방 PK
     * @param jwtToken - 사용자 인증 토큰
     * @return List<MessageResponse> - 메시지 목록 (최신순, 최대 20개)
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/dm/{dmRoomPk}/messages
     * <p>
     * 사용 시점: 사용자가 DM방에 처음 들어갈 때
     */
    @Override
    public List<MessageResponse> getLatestDmMessage(Integer dmRoomPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            List<Message> messages = messageRepository.findLatestMessagesByDmRoomPk(dmRoomPk);
            return messages.stream().map(this::convertToMessageResponse).collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("최신 DM 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("최신 DM 메시지 조회 중 서버 오류가 발생했습니다 : " + e.getMessage());
        }
    }

    /**
     * DM방의 이전 메시지 20개 조회 (스크롤 위로 올릴 때)
     *
     * @param dmRoomPk - 조회할 DM방 PK
     * @param lastMessageTime - 현재 화면에서 가장 오래된 메시지의 시간
     * @param jwtToken - 사용자 인증 토큰
     * @return List<MessageResponse> - 이전 메시지 목록 (최대 20개)
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/dm/{dmRoomPk}/messages/older
     * <p>
     * 사용 시점: 사용자가 DM 채팅창을 위로 스크롤할 때
     */
    @Override
    public List<MessageResponse> getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            List<Message> messages = messageRepository.findOlderMessagesByDmRoomPk(dmRoomPk, lastMessageTime);
            return messages.stream().map(this::convertToMessageResponse).collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("이전 DM 메시지 조회 실패: {}", e.getMessage());
            throw new InternalServerErrorException("이전 DM 메시지 조회 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * Message 엔티티 → ChatMessage DTO 변환 (WebSocket 응답용)
     *
     * @param message - DB에서 조회한 Message 엔티티
     * @return ChatMessage - WebSocket으로 클라이언트에게 전송할 DTO
     * <p>
     * 호출되는 곳:
     * - ChatWebSocketController
     * <p>
     * 변환 내용:
     * - message.getChannelPk() (Channel 엔티티) → channelPk (Integer)
     * - message.getDmRoomPk() (DmRoom 엔티티)   → dmRoomPk (Integer)
     * - message.getUserPk() (Users 엔티티)      → userPk (Integer), userName (String)
     * <p>
     * 용도: 실시간 채팅 메시지를 다른 사용자들에게 브로드캐스트할 때
     * <p>
     * ChatMessage DTO 구조:
     * {
     * "messagePk": 123,
     * "channelPk": 1,
     * "dmRoomPk": null,
     * "userPk": 5,
     * "userName": "홍길동",    ← REST API와 다르게 userName 포함!
     * "content": "안녕하세요",
     * "messageType": "TEXT",
     * "createdAt": "2025-01-20T10:30:00"
     * }
     */
    @Override
    public ChatMessage convertToChatMessage(Message message) {
        try {
            return ChatMessage.builder().messagePk(message.getMessagePk()).channelPk(message.getChannelPk() != null ? message.getChannelPk().getChannelPk() : null).dmRoomPk(message.getDmRoomPk() != null ? message.getDmRoomPk().getDmRoomPk() : null).userPk(message.getUserPk().getUserPk()).userName(message.getUserPk().getUserName()).content(message.getContent()).createdAt(message.getCreatedAt()).messageType(message.getMessageType()).build();
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("ChatMessage 변환 실패: {}", e.getMessage());
            throw new InternalServerErrorException("ChatMessage 변환 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * Message 엔티티 → MessageResponse DTO 변환 (REST API 응답용)
     *
     * @param message - DB에서 조회한 Message 엔티티
     * @return MessageResponse - REST API로 클라이언트에게 전송할 DTO
     * <p>
     * 호출되는 곳:
     * - getLatestMessage()
     * - getOlderMessage()
     * - getLatestDmMessage()
     * - getOlderDmMessage()
     * <p>
     * 용도: 채널/DM방 입장 시 기존 메시지 목록 조회
     * <p>
     * MessageResponse DTO 구조: (ChatMessage와 동일)
     * {
     * "messagePk": 123,
     * "channelPk": 1,
     * "dmRoomPk": null,
     * "userPk": 5,
     * "userName": "홍길동",
     * "content": "안녕하세요",
     * "messageType": "TEXT",
     * "createdAt": "2025-01-20T10:30:00"
     * }
     */
    @Override
    public MessageResponse convertToMessageResponse(Message message) {
        try {
            return MessageResponse.builder().messagePk(message.getMessagePk()).channelPk(message.getChannelPk() != null ? message.getChannelPk().getChannelPk() : null).dmRoomPk(message.getDmRoomPk() != null ? message.getDmRoomPk().getDmRoomPk() : null).userPk(message.getUserPk().getUserPk()).userName(message.getUserPk().getUserName()).content(message.getContent()).createdAt(message.getCreatedAt()).messageType(message.getMessageType()).build();
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("MessageResponse 변환 실패: {}", e.getMessage());
            throw new InternalServerErrorException("MessageResponse 변환 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     이 아래는 Private 유틸 함수
     */

    /**
     * JWT 토큰에서 userPk 추출
     *
     * @param jwtToken - JWT 토큰 문자열
     * @return Integer - 사용자 PK
     * <p>
     * 처리 순서:
     * 1. JwtTokenProvider로 토큰에서 userEmail 추출
     * 2. UserRepository에서 userEmail로 userPk 조회
     */
    private Integer getUserPkFromToken(String jwtToken) {
        String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
        return userRepository.findUserPkByUserEmail(userEmail).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
    }


    /**
     * 채널 접근 권한 검증
     *
     * @param channelPk - 접근하려는 채널 PK
     * @param userPk - 접근하려는 사용자 PK
     * @throws ForbiddenException - 권한 없으면 403 에러
     * <p>
     * 검증 방법:
     * - ChannelMember 테이블에 (channelPk, userPk) 조합이 있는지 확인
     */
    private void validateChannelAccess(Integer channelPk, Integer userPk) {
        if (!memberService.hasChannelAccess(channelPk, userPk)) {
            throw new ForbiddenException("해당 채널에 접근할 권한이 없습니다.");
        }
    }

    /**
     * DM방 접근 권한 검증
     *
     * @param dmRoomPk - 접근하려는 DM방 PK
     * @param userPk - 접근하려는 사용자 PK
     * @throws ForbiddenException - 권한 없으면 403 에러
     * <p>
     * 검증 방법:
     * - DmMember 테이블에 (dmRoomPk, userPk) 조합이 있는지 확인
     */
    private void validateDmRoomAccess(Integer dmRoomPk, Integer userPk) {
        if (!memberService.hasDmRoomAccess(dmRoomPk, userPk)) {
            throw new ForbiddenException("해당 DM방에 접근할 권한이 없습니다.");
        }
    }


}
