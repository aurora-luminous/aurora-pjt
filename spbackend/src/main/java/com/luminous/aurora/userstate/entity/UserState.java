package com.luminous.aurora.userstate.entity;


import com.luminous.aurora.auth.entity.Users;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users_state")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserState {
    @Id
    private Integer userPk;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.OFFLINE;

    private Boolean isOnline = false;

    private LocalDateTime lastSeen;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk", insertable = false, updatable = false)
    private Users user;
}
