package com.luminous.aurora.internal.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelMemberBroadcast {
    private String eventType;
    private String userName;
    private String userEmail;
    private String profileImagePath;
}
