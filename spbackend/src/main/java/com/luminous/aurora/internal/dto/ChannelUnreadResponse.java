package com.luminous.aurora.internal.dto;

import lombok.*;

// Spring -> Express 응답 DTO
@Builder
@Getter
public class ChannelUnreadResponse {
    private Integer channelPk;
    private boolean hasUnread;
}
