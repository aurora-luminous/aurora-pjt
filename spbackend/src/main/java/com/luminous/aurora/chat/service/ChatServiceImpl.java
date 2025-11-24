package com.luminous.aurora.chat.service;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.repository.MessageRepository;
import com.luminous.aurora.common.error.exception.ForbiddenException;
import com.luminous.aurora.common.error.exception.InternalServerErrorException;
import com.luminous.aurora.common.error.exception.NotFoundException;
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

    @Override
    @Transactional
    public void saveMessage(MessageRequest request, String jwtToken) {
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

            Message message = Message.builder()
                    .channelPk(request.getChannelPk())
                    .dmRoomPk(request.getDmRoomPk())
                    .userPk(userPk)
                    .content(request.getContent())
                    .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                    .build();

            messageRepository.save(message);

            log.info("메세지 저장: channelPk = {}, userPk = {}", request.getChannelPk(), userPk);
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("메시지 저장 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("메시지 저장 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    @Override
    public List<MessageResponse> getLatestMessage(Integer channelPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            List<Message> messages = messageRepository.findLatestMessagesByChannelPk(channelPk);

            return messages.stream()
                    .map(this::convertToMessageResponse)
                    .collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("최신 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("최신 메시지 조회 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    @Override
    public List<MessageResponse> getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateChannelAccess(channelPk, userPk);

            List<Message> messages = messageRepository.findOlderMessagesByChannelPk(channelPk, lastMessageTime);
            return messages.stream()
                    .map(this::convertToMessageResponse)
                    .collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("이전 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("이전 메시지 조회 중 서버 오류가 발생했습니다. " + e.getMessage());
        }
    }

    @Override
    public List<MessageResponse> getLatestDmMessage(Integer dmRoomPk, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            List<Message> messages = messageRepository.findLatestMessagesByDmRoomPk(dmRoomPk);
            return messages.stream()
                    .map(this::convertToMessageResponse)
                    .collect(Collectors.toList());
        } catch (ForbiddenException e) {
            throw e;
        } catch (Exception e) {
            log.error("최신 DM 메시지 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("최신 DM 메시지 조회 중 서버 오류가 발생했습니다 : " + e.getMessage());
        }
    }

    @Override
    public List<MessageResponse> getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, String jwtToken) {
        try {
            Integer userPk = getUserPkFromToken(jwtToken);
            validateDmRoomAccess(dmRoomPk, userPk);

            List<Message> messages = messageRepository.findOlderMessagesByDmRoomPk(dmRoomPk, lastMessageTime);
            return messages.stream()
                    .map(this::convertToMessageResponse)
                    .collect(Collectors.toList());
        } catch (ForbiddenException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("이전 DM 메시지 조회 실패: {}", e.getMessage());
            throw new InternalServerErrorException("이전 DM 메시지 조회 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }


    @Override
    public ChatMessage convertToChatMessage(Message message) {
        try {
            return ChatMessage.builder()
                    .messagePk(message.getMessagePk())
                    .channelPk(message.getChannelPk())
                    .dmRoomPk(message.getDmRoomPk())
                    .userPk(message.getUserPk())
                    .userName(getUserNameByUserPk(message.getUserPk()))
                    .content(message.getContent())
                    .createdAt(message.getCreatedAt())
                    .messageType(message.getMessageType())
                    .build();
        } catch (Exception e) {
            log.error("ChatMessage 변환 실패: {}", e.getMessage());
            throw new InternalServerErrorException("ChatMessage 변환 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // Message 엔티티를 MessageResponse로 변환
    @Override
    public MessageResponse convertToMessageResponse(Message message) {
        try {
            return MessageResponse.builder()
                    .messagePk(message.getMessagePk())
                    .channelPk(message.getChannelPk())
                    .dmRoomPk(message.getDmRoomPk())
                    .userPk(message.getUserPk())
                    .userName(getUserNameByUserPk(message.getUserPk()))
                    .content(message.getContent())
                    .createdAt(message.getCreatedAt())
                    .messageType(message.getMessageType())
                    .build();
        } catch (Exception e) {
            log.error("MessageResponse 변환 실패: {}", e.getMessage());
            throw new InternalServerErrorException("MessageResponse 변환 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // jwt 토큰에서 userPk 추출
    private Integer getUserPkFromToken(String jwtToken) {
        String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
        return userRepository.findUserPkByUserEmail(userEmail)
                .orElseThrow(()-> new NotFoundException("사용자를 찾을 수 없습니다."));
    }

    private String getUserNameByUserPk(Integer userPk) {
        try {
            return userRepository.findById(userPk)
                    .map(user -> user.getUserName())
                    .orElse("알 수 없는 사용자");
        } catch (Exception e) {
            log.error("사용자명 조회 실패: {}", e.getMessage());
            return "알 수 없는 사용자";
        }
    }

    // 채널 접근 권한 검증
    private void validateChannelAccess(Integer channelPk, Integer userPk){
        if (!memberService.hasChannelAccess(channelPk, userPk)) {
            throw new ForbiddenException("해당 채널에 접근할 권한이 없습니다.");
        }
    }

    // dm 방 접근 권한 검증
    private void validateDmRoomAccess(Integer dmRoomPk, Integer userPk) {
        if (!memberService.hasDmRoomAccess(dmRoomPk, userPk)) {
            throw new ForbiddenException("해당 DM방에 접근할 권한이 없습니다.");
        }
    }


}
