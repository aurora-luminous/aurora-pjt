package com.luminous.aurora.userstate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberChangeEvent {
    private String eventType; // "MEMBER_ADDED", "MEMBER_REMOVED"
    private Integer projectPk;
    private Integer dmRoomPk;
    private Integer userPk;
    private String userName;
    private String projectRole; // 프로젝트의 경우만
    private Long timestamp;
}