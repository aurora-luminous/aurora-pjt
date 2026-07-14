package com.luminous.aurora.internal.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Spring -> frontend 발신 dto
public class ChannelChangeBroadCast {
    private String eventType;
    private Integer channelPk;
    private String channelName;
}
