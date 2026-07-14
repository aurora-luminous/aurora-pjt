package com.luminous.aurora.member.entity;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.channel.entity.Channel;
import com.luminous.aurora.chat.entity.Message;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "channel_member")
public class ChannelMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer channelMemberPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_pk")
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk")
    private Users user;

    private String cStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_message")
    private Message lastReadMessage;

    private String channelRole;
    private Boolean isMute;
}
