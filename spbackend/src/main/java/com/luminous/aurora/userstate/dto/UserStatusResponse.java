package com.luminous.aurora.userstate.dto;

import com.luminous.aurora.userstate.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusResponse {
    private Integer userPk;
    private UserStatus status;
    private LocalDateTime lastSeen;
}
