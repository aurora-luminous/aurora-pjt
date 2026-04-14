package com.luminous.aurora.chat.service;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.channel.entity.Channel;
import com.luminous.aurora.channel.repository.ChannelRepository;
import com.luminous.aurora.chat.dto.MessageListResponse;
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
import com.luminous.aurora.internal.dto.ChannelUnreadResponse;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.entity.ChannelMember;
import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.member.repository.ChannelMemberRepository;
import com.luminous.aurora.member.repository.DmMemberRepository;
import com.luminous.aurora.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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
    private final ChannelMemberRepository channelMemberRepository;
    private final DmMemberRepository dmMemberRepository;

    /**
     * 채널 메시지를 DB에 저장
     *
     * @param request - 메시지 내용 (content, messageType)
     * @param channelPk - 대상 채널 PK (WebSocket PathVariable에서 전달)
     * @param jwtToken - 사용자 인증 토큰
     * <p>
     * 호출되는 곳:
     * - ChatWebSocketController.sendChannelMessage()
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널 접근 권한 검증
     * 3. Channel, Users 엔티티 조회
     * 4. Message 엔티티 생성 및 DB 저장
     */
    @Override
    @Transactional
    public Message saveChannelMessage(MessageRequest request, Integer channelPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            Channel channel = channelRepository.findById(channelPk).orElseThrow(() -> new NotFoundException("채널을 찾을 수 없습니다."));

            Users user = userRepository.findById(userPk).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

            Message message = Message.builder().channelPk(channel).userPk(user).content(request.getContent()).messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT").build();

            Message savedMessage = messageRepository.save(message);

            return savedMessage;
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("메시지 저장 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("메시지 저장 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    /**
     * DM 메시지를 DB에 저장
     *
     * @param request - 메시지 내용 (content, messageType)
     * @param dmRoomPk - 대상 DM방 PK (WebSocket PathVariable에서 전달)
     * @param jwtToken - 사용자 인증 토큰
     * <p>
     * 호출되는 곳:
     * - ChatWebSocketController.sendDmMessage()
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. DM방 접근 권한 검증
     * 3. DmRoom, Users 엔티티 조회
     * 4. Message 엔티티 생성 및 DB 저장
     */
    @Override
    @Transactional
    public Message saveDmMessage(MessageRequest request, Integer dmRoomPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            DmRoom dmRoom = dmRoomRepository.findById(dmRoomPk).orElseThrow(() -> new NotFoundException("DM 방을 찾을 수 없습니다."));

            Users user = userRepository.findById(userPk).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

            Message message = Message.builder().dmRoomPk(dmRoom).userPk(user).content(request.getContent()).messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT").build();

            Message savedMessage = messageRepository.save(message);
            log.info("DM 메시지 저장: dmRoomPk = {}, userPk = {}", dmRoomPk, userPk);

            return savedMessage;
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("DM 메시지 저장 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("메시지 저장 중 서버 오류가 발생했습니다.: " + e.getMessage());
        }
    }

    /**
     * 채널의 최신 메시지 40개 조회 (처음 채널 입장 시)
     *
     * @param channelPk - 조회할 채널 PK
     * @param jwtToken - 사용자 인증 토큰
     * @return MessageListResponse - lastReadMessagePk + 메시지 목록
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/channel/{channelPk}/messages
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널 접근 권한 검증
     * 3. MessageRepository에서 최신 40개 조회
     * 4. Message → MessageResponse DTO 변환
     * <p>
     * 사용 시점: 사용자가 채널에 처음 들어갈 때
     */
    @Override
    public MessageListResponse getLatestMessage(Integer channelPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            List<Message> messages = messageRepository.findLatestMessagesByChannelPk(channelPk);
            List<MessageResponse> messageResponses = messages.stream().map(this::convertToMessageResponse).toList();

            Long lastReadMessagePk = getChannelLastReadMessagePk(channelPk, userPk);

            return MessageListResponse.builder().lastReadMessagePk(lastReadMessagePk).messages(messageResponses).build();

        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("최신 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("최신 메시지 조회 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    /**
     * 채널의 이전 메시지 40개 조회 (스크롤 위로 올릴 때)
     *
     * @param channelPk - 조회할 채널 PK
     * @param lastMessageTime - 현재 화면에서 가장 오래된 메시지의 시간
     * @param jwtToken - 사용자 인증 토큰
     * @return MessageListResponse - lastReadMessagePk + 메시지 목록
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/channel/{channelPk}/messages/older
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널 접근 권한 검증
     * 3. lastMessageTime 이전의 메시지 40개 조회
     * 4. Message → MessageResponse DTO 변환
     * <p>
     * 사용 시점: 사용자가 채팅창을 위로 스크롤할 때 (무한 스크롤)
     */
    @Override
    public MessageListResponse getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            List<Message> messages = messageRepository.findOlderMessagesByChannelPk(channelPk, lastMessageTime);
            List<MessageResponse> messageResponses = messages.stream().map(this::convertToMessageResponse).toList();
            Long lastReadMessagePk = getChannelLastReadMessagePk(channelPk, userPk);

            return MessageListResponse.builder().lastReadMessagePk(lastReadMessagePk).messages(messageResponses).build();

        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("이전 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("이전 메시지 조회 중 서버 오류가 발생했습니다. " + e.getMessage());
        }
    }

    /**
     * DM방의 최신 메시지 40개 조회 (처음 DM방 입장 시)
     *
     * @param dmRoomPk - 조회할 DM방 PK
     * @param jwtToken - 사용자 인증 토큰
     * @return MessageListResponse - lastReadMessagePk + 메시지 목록
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/dm/{dmRoomPk}/messages
     * <p>
     * 사용 시점: 사용자가 DM방에 처음 들어갈 때
     */
    @Override
    public MessageListResponse getLatestDmMessage(Integer dmRoomPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            List<Message> messages = messageRepository.findLatestMessagesByDmRoomPk(dmRoomPk);
            List<MessageResponse> messageResponses = messages.stream().map(this::convertToMessageResponse).toList();

            Long lastReadMessagePk = getDmLastReadMessagePk(dmRoomPk, userPk);

            return MessageListResponse.builder().lastReadMessagePk(lastReadMessagePk).messages(messageResponses).build();

        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("최신 DM 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("최신 DM 메시지 조회 중 서버 오류가 발생했습니다 : " + e.getMessage());
        }
    }

    /**
     * DM방의 이전 메시지 40개 조회 (스크롤 위로 올릴 때)
     *
     * @param dmRoomPk - 조회할 DM방 PK
     * @param lastMessageTime - 현재 화면에서 가장 오래된 메시지의 시간
     * @param jwtToken - 사용자 인증 토큰
     * @return List<MessageResponse> - 이전 메시지 목록 (최대 40개)
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → GET /api/jv/chat/dm/{dmRoomPk}/messages/older
     * <p>
     * 사용 시점: 사용자가 DM 채팅창을 위로 스크롤할 때
     */
    @Override
    public MessageListResponse getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            List<Message> messages = messageRepository.findOlderMessagesByDmRoomPk(dmRoomPk, lastMessageTime);
            List<MessageResponse> messageResponses = messages.stream().map(this::convertToMessageResponse).toList();

            Long lastReadMessagePk = getDmLastReadMessagePk(dmRoomPk, userPk);

            return MessageListResponse.builder().lastReadMessagePk(lastReadMessagePk).messages(messageResponses).build();
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("이전 DM 메시지 조회 실패: {}", e.getMessage());
            throw new InternalServerErrorException("이전 DM 메시지 조회 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 여러 채널의 안 읽은 메시지 존재 여부 일괄 조회
     *
     * @param channelPks - 조회할 채널 PK 목록
     * @param userPk - 조회 대상 사용자 PK
     * @return List<ChannelUnreadResponse> - 채널별 hasUnread 목록
     * <p>
     * 호출되는 곳:
     * - InternalController → POST /api/jv/internal/channels/unread
     * <p>
     * 처리 순서 (채널별 반복):
     * 1. ChannelMember 조회 (channelPk + userPk)
     * 2. 멤버가 아니면 → hasUnread = false
     * 3. lastReadMessage가 null (한 번도 읽지 않음)
     * → 채널에 메시지가 1개라도 있으면 true, 없으면 false
     * 4. lastReadMessage가 있으면 → 이후 메시지 존재 여부 확인 (내가 보낸 것 제외)
     * <p>
     * 용도: Express에서 채널 목록 조회 시
     * Spring에 일괄 요청하여 unread 상태를 합쳐서 프론트에 내려주기 위함
     * <p>
     * 응답 예시:
     * [
     * { "channelPk": 1, "hasUnread": true },
     * { "channelPk": 3, "hasUnread": false }
     * ]
     */
    @Override
    public List<ChannelUnreadResponse> getChannelsUnreadStatus(List<Integer> channelPks, Integer userPk) {
        try {
            return channelPks.stream().map(channelPk -> {
                Optional<ChannelMember> memberOpt = channelMemberRepository.findByChannel_ChannelPkAndUser_UserPk(channelPk, userPk);

                if (memberOpt.isEmpty()) {
                    return ChannelUnreadResponse.builder().channelPk(channelPk).hasUnread(false).build();
                }

                ChannelMember member = memberOpt.get();
                boolean hasUnread;

                if (member.getLastReadMessage() == null) {
                    hasUnread = messageRepository.existsByChannelPk_ChannelPk(channelPk);
                } else {
                    hasUnread = messageRepository.existsUnreadMessages(channelPk, member.getLastReadMessage().getMessagePk(), userPk);
                }

                return ChannelUnreadResponse.builder().channelPk(channelPk).hasUnread(hasUnread).build();
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("채널 일괄 안 읽음 상태 조회 실패: {}", e.getMessage());
            throw new InternalServerErrorException("채널 안 읽음 상태 조회 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * -------------------------------------------------------------------------------------
     * 안읽음 메시지 처리용 함수
     * -------------------------------------------------------------------------------------
     */

    /**
     * 채널 메시지 읽음 처리
     *
     * @param channelPk - 읽음 처리할 채널 PK
     * @param messagePk - 마지막으로 읽은 메시지 PK
     * @param jwtToken - 사용자 인증 토큰
     * <p>
     * 호출되는 곳:
     * - ChatWebSocketController → /app/chat/channel/{channelPk}/read
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. 채널 접근 권한 검증
     * 3. ChannelMember 엔티티 조회 (channelPk + userPk)
     * 4. 해당 messagePk의 Message 엔티티 조회
     * 5. ChannelMember.lastReadMessage 업데이트 및 저장
     * <p>
     * 용도: 프론트에서 사용자가 채널 메시지를 읽었을 때,
     * 마지막으로 읽은 메시지 PK를 전송하여 읽음 위치를 기록
     * <p>
     * 연관 기능:
     * - 채널 목록에서 안 읽은 메시지 존재 여부(hasUnread) 판단 시 사용
     */
    @Override
    @Transactional
    public void markChannelAsRead(Integer channelPk, Long messagePk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            ChannelMember channelMember = channelMemberRepository.findByChannel_ChannelPkAndUser_UserPk(channelPk, userPk).orElseThrow(() -> new NotFoundException("채널 멤버를 찾을 수 없습니다."));

            Message message = messageRepository.findById(messagePk).orElseThrow(() -> new NotFoundException("메시지를 찾을 수 없습니다."));

            channelMember.setLastReadMessage(message);
            channelMemberRepository.save(channelMember);

            log.info("채널 읽음 처리: channelPk={}, userPk={}, messagePk={}", channelPk, userPk, messagePk);
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("채널 읽음 처리 실패: {}", e.getMessage());
            throw new InternalServerErrorException("채널 읽음 처리 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * DM 메시지 읽음 처리
     *
     * @param dmRoomPk - 읽음 처리할 DM방 PK
     * @param messagePk - 마지막으로 읽은 메시지 PK
     * @param jwtToken - 사용자 인증 토큰
     * <p>
     * 호출되는 곳:
     * - ChatWebSocketController → /app/chat/dm/{dmRoomPk}/read
     * <p>
     * 처리 순서:
     * 1. JWT에서 userPk 추출
     * 2. DM방 접근 권한 검증
     * 3. DmMember 엔티티 조회 (dmRoomPk + userPk)
     * 4. 해당 messagePk의 Message 엔티티 조회
     * 5. DmMember.lastReadMessage 업데이트 및 저장
     * <p>
     * 용도: 프론트에서 사용자가 DM 메시지를 읽었을 때,
     * 마지막으로 읽은 메시지 PK를 전송하여 읽음 위치를 기록
     * <p>
     * 연관 기능:
     * - DM 목록 조회 시 unreadCount 계산에 사용
     * (UserStateServiceImpl.getDmRoomsWithStatus → countUnreadMessages)
     */
    @Override
    @Transactional
    public void markDmAsRead(Integer dmRoomPk, Long messagePk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            DmMember dmMember = dmMemberRepository.findByDmRoom_DmRoomPkAndUser_UserPk(dmRoomPk, userPk).orElseThrow(() -> new NotFoundException("DM 멤버를 찾을 수 없습니다."));

            Message message = messageRepository.findById(messagePk).orElseThrow(() -> new NotFoundException("메시지를 찾을 수 없습니다."));

            dmMember.setLastReadMessage(message);
            dmMemberRepository.save(dmMember);

            log.info("DM 읽음 처리 : dmRoomPK ={}, userPk={}, messagePk={}", dmRoomPk, userPk, messagePk);
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new InternalServerErrorException("DM 읽음 처리 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * ------------------------------------------------------------------------------------------------
     * DTO 변환용 함수
     * ------------------------------------------------------------------------------------------------
     */


    /**
     * Message 엔티티 → MessageResponse DTO 변환
     * <p>
     * REST API 응답과 WebSocket 브로드캐스트 모두에서 사용하는 통합 변환 메서드.
     * 기존에는 REST용(convertToMessageResponse)과 WebSocket용(convertToChatMessage)이
     * 분리되어 있었으나, 두 DTO의 필드가 동일하여 MessageResponse로 통합함.
     *
     * @param message - DB에서 조회하거나 저장된 Message 엔티티
     * @return MessageResponse - 클라이언트에게 전달할 메시지 DTO
     * <p>
     * 호출되는 곳:
     * - ChatController (REST API) → 채널/DM 메시지 조회 시
     * - ChatWebSocketController  → 채널/DM 메시지 전송 시 브로드캐스트용
     */
    @Override
    public MessageResponse convertToMessageResponse(Message message) {
        try {
            Users user = message.getUserPk();

            return MessageResponse.builder().messagePk(message.getMessagePk()).userEmail(user.getUserEmail()).userName(user.getUserName()).userProfileImage(user.getProfileImagePath()).content(message.getContent()).createdAt(message.getCreatedAt()).messageType(message.getMessageType()).build();
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
     * 채널에서 현재 사용자의 lastReadMessagePk 조회
     *
     * @return Long - 마지막으로 읽은 메시지 PK (읽은 적 없으면 null)
     */
    private Long getChannelLastReadMessagePk(Integer channelPk, Integer userPk) {
        return channelMemberRepository.findByChannel_ChannelPkAndUser_UserPk(channelPk, userPk).map(ChannelMember::getLastReadMessage).map(Message::getMessagePk).orElse(null);
    }

    /**
     * DM방에서 현재 사용자의 lastReadMessagePk 조회
     *
     * @return Long - 마지막으로 읽은 메시지 PK (읽은 적 없으면 null)
     */
    private Long getDmLastReadMessagePk(Integer dmRoomPk, Integer userPk) {
        return dmMemberRepository.findByDmRoom_DmRoomPkAndUser_UserPk(dmRoomPk, userPk).map(DmMember::getLastReadMessage).map(Message::getMessagePk).orElse(null);
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
