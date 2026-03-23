package com.luminous.aurora.chat.dto;

import lombok.*;

@Builder
@Getter
public class UnreadNotification {
    private Integer channelPk;
    private Integer dmRoomPk;
    private String sendUserEmail;
}
