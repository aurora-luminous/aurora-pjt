package com.luminous.aurora.internal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberChangeEvent {
    private String eventType; // "MEMBER_ADDED", "MEMBER_REMOVED", "MEMBER_UPDATED"
    private List<Integer> channelPks; // 변경 대상 채널 pk 리스트
    private String userEmail;
    private String userName;
    private String profileImagePath;
}