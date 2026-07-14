package com.luminous.aurora.member.dto;


import com.luminous.aurora.userstate.entity.UserStatus;
import lombok.*;

@Builder
@Getter
public class ChannelMemberResponse {
    private String userName;
    private String userEmail;
    private String profileImage;
    private String channelRole;
    private UserStatus userStatus;
}
