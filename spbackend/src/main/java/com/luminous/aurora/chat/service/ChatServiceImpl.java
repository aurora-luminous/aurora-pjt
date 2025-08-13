package com.luminous.aurora.chat.service;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.chat.dto.MessageRequest;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.chat.repository.MessageRepository;
import com.luminous.aurora.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService{

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public Message saveMessage(MessageRequest request, String jwtToken){

        // JWT에서 userEmail 추출
        String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
        log.info("메세지 저장: channelPk = {}, userEmail = {}", request.getChannelPk(), userEmail);

        // userEmail로 userPk 조회
        Integer userPk = userRepository.findUserPkByUserEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

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
        return messageRepository.save(message);
    }

    // 채널 접근 권한 검증
    private void validateChannelAccess(Integer channelPk, Integer userPk){

    }

    // dm 방 접근 권한 검증
    private void validateDmRoomAccess(Integer dmRoomPk, Integer userPk) {

    }
}
