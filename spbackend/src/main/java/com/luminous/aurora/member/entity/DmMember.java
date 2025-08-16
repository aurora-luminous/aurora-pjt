package com.luminous.aurora.member.entity;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.chat.entity.Message;
import com.luminous.aurora.dmroom.entity.DmRoom;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "dmmember")
public class DmMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer dmMemberPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk")
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dm_room_pk")
    private DmRoom dmRoom;

    private Boolean isMute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_message")
    private Message lastReadMessage;
}
