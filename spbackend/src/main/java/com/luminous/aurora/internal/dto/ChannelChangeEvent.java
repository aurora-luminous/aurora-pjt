package com.luminous.aurora.internal.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Express -> Spring 수신 dto
public class ChannelChangeEvent {
    private String eventType; // "CHANNEL_ADDED" | "CHANNEL_REMOVED" | "CHANNEL_UPDATED"
    private Integer channelPk;
    private String channelName;
    private Integer projectPk;
}
