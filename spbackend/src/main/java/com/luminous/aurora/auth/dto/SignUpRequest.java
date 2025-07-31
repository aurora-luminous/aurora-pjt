package com.luminous.aurora.auth.dto;


import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {

    private String userEmail;
    private String userName;
    private String password;

}
