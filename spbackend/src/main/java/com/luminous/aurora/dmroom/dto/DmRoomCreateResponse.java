package com.luminous.aurora.dmroom.dto;

import lombok.*;


@Builder
@Getter
public class DmRoomCreateResponse {
    private Integer dmRoomPk;
    private String targetUserEmail;
    private String targetUserName;
    private String targetUserProfileImage;
}
