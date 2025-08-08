package com.luminous.aurora.chat.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messagePk;

    private Integer channelPk;
    private Integer dmRoomPk;
    private Integer userPk;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // 채널 메시지인지 DM 메시지인지 확인
    public boolean isChannelMessage() {
        return channelPk != null && dmRoomPk == null;
    }

    public boolean isDmMessage() {
        return dmRoomPk != null && channelPk == null;
    }
}
