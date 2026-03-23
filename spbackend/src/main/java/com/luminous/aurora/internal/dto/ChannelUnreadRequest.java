package com.luminous.aurora.internal.dto;

import lombok.*;

import java.util.List;

// Express -> Spring 으로 오는 유저별 채널 목록
@Getter
@NoArgsConstructor
public class ChannelUnreadRequest {
    private List<Integer> channelPks;
    private Integer userPk;
}
