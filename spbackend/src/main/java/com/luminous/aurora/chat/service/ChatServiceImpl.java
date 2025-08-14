package com.luminous.aurora.chat.service;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.chat.dto.ChatMessage;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.dto.MessageResponse;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.repository.MessageRepository;
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
public class ChatServiceImpl implements ChatService{

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberService memberService;

    @Override
    @Transactional
    public void saveMessage(MessageRequest request, String jwtToken){

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
    }

    @Override
    public List<MessageResponse> getLatestMessage(Integer channelPk, String jwtToken) {
        Integer userPk = getUserPkFromToken(jwtToken);
        validateChannelAccess(channelPk,userPk);

        List<Message> messages = messageRepository.findLatestMessagesByChannelPk(channelPk);

        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> getOlderMessage(Integer channelPk, LocalDateTime lastMessageTime, String jwtToken) {
        Integer userPk = getUserPkFromToken(jwtToken);
        validateChannelAccess(channelPk, userPk);

        List<Message> messages = messageRepository.findOlderMessagesByChannelPk(channelPk,lastMessageTime);
        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> getLatestDmMessage(Integer dmRoomPk, String jwtToken) {
        Integer userPk = getUserPkFromToken(jwtToken);
        validateDmRoomAccess(dmRoomPk, userPk);

        List<Message> messages = messageRepository.findLatestMessagesByDmRoomPk(dmRoomPk);
        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> getOlderDmMessage(Integer dmRoomPk, LocalDateTime lastMessageTime, String jwtToken) {
        Integer userPk = getUserPkFromToken(jwtToken);
        validateDmRoomAccess(dmRoomPk, userPk);

        List<Message> messages = messageRepository.findOlderMessagesByDmRoomPk(dmRoomPk, lastMessageTime);
        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }


    @Override
    public ChatMessage convertToChatMessage(Message message) {
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
    }
    // Message 엔티티를 MessageResponse로 변환
    @Override
    public MessageResponse convertToMessageResponse(Message message) {
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
    }
    // jwt 토큰에서 userPk 추출
    private Integer getUserPkFromToken(String jwtToken) {
        String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
        return userRepository.findUserPkByUserEmail(userEmail)
                .orElseThrow(()-> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    private String getUserNameByUserPk(Integer userPk){
        return userRepository.findById(userPk)
                .map(user->user.getUserName())
                .orElse("알 수 없는 사용자");
    }

    // 채널 접근 권한 검증
    private void validateChannelAccess(Integer channelPk, Integer userPk){
        if (!memberService.hasChannelAccess(channelPk, userPk)) {
            throw new RuntimeException("해당 채널에 접근할 권한이 없습니다.");
        }
    }

    // dm 방 접근 권한 검증
    private void validateDmRoomAccess(Integer dmRoomPk, Integer userPk) {
        if (!memberService.hasDmRoomAccess(dmRoomPk, userPk)) {
            throw new RuntimeException("해당 DM방에 접근할 권한이 없습니다.");
        }
    }



}
