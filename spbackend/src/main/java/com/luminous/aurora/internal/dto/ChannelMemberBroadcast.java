package com.luminous.aurora.internal.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Spring -> frontend 발신 dto
public class ChannelMemberBroadcast {
    private String eventType;
    private String userName;
    private String userEmail;
    private String profileImagePath;
}
