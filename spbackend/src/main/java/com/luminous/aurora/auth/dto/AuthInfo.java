package com.luminous.aurora.auth.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class AuthInfo {
    private String userName;
    private String userEmail;
    private String profileImagePath;
}
