package com.luminous.aurora.auth.dto;


import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String userEmail;
    private String password;

}
