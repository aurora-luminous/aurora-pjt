package com.luminous.aurora.chat.dto;

import lombok.*;

@Builder
public class ChannelUnreadResponse {
    private Integer channelPk;
    private boolean hasUnread;
}
