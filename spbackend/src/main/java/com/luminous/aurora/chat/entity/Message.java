package com.luminous.aurora.chat.entity;


import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.channel.entity.Channel;
import com.luminous.aurora.dmroom.entity.DmRoom;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_pk")
    private Channel channelPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dm_room_pk")
    private DmRoom dmRoomPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk", nullable = false)
    private Users userPk;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String messageType;  // "TEXT", "FILE", "IMAGE" 등

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
