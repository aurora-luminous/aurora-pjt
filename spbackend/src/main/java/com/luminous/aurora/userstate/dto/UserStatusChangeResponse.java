package com.luminous.aurora.userstate.dto;

import com.luminous.aurora.userstate.entity.UserStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusChangeResponse {
    private Integer userPk;
    private UserStatus status;
    private Long timestamp;
}
