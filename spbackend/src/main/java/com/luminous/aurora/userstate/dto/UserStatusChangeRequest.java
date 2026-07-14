package com.luminous.aurora.userstate.dto;

import com.luminous.aurora.userstate.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusChangeRequest {
    private UserStatus status;
    private Integer projectPk;  // 브로드캐스트용
    private Integer dmRoomPk;   // 브로드캐스트용
}