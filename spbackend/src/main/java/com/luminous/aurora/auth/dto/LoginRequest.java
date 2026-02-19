package com.luminous.aurora.auth.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String userEmail;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
}