package com.luminous.aurora.chat.dto;


import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private Integer channelPk;
    private Integer dmRoomPk;
    private String content;
    private String messageType;
}
