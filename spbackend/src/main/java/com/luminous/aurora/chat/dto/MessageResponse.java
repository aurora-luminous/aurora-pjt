package com.luminous.aurora.chat.dto;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long messagePk;
    private Integer channelPk;
    private Integer dmRoomPk;
    private Integer userPk;
    private String userName;
    private String content;
    private LocalDateTime createdAt;
    private String messageType;
}
