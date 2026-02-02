package com.luminous.aurora.member.dto;

import com.luminous.aurora.userstate.entity.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DmRoomResponse {
    private Integer dmRoomPk;
    private String otherUserEmail; // 상대방 email
    private String otherUserName; // 상대방 이름
    private String otherProfileImage; // 상대 프로필 이미지
    private Boolean isMute; // 차단 여부 node.js 에서 관리하는데 현재는 기능 없는걸로앎
    private UserStatus userStatus; // 상대방 실시간 상태 (Online, Away, DND, Offline)
    private String lastMessageContent; // 마지막 메시지 미리보기
    private LocalDateTime lastMessageTime; // 마지막 메시지 시간
    private Integer unreadCount; // 읽지 않은 메시지 수
}
