package com.luminous.aurora.auth.service;

import com.luminous.aurora.auth.dto.AuthInfo;
import com.luminous.aurora.auth.dto.LoginRequest;
import com.luminous.aurora.auth.dto.SignUpRequest;
import com.luminous.aurora.auth.dto.TokenResponse;

public interface AuthService {

    TokenResponse login(LoginRequest request);

    void signUp(SignUpRequest request);

    void logout(String userEmail);

    AuthInfo getUserInfo(String userEmail);
}
