package com.luminous.aurora.auth.controller;


import com.luminous.aurora.auth.dto.LoginRequest;
import com.luminous.aurora.auth.dto.SignUpRequest;
import com.luminous.aurora.auth.dto.TokenResponse;
import com.luminous.aurora.auth.service.AuthService;
import com.luminous.aurora.auth.service.TokenService;
import com.luminous.aurora.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignUpRequest request) {
        log.info("회원가입 요청 : userEmail = {}", request.getUserEmail());
        authService.signUp(request);

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }


    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        log.info("로그인 요청: Email = {}",request.getUserEmail());

        TokenResponse tokens = authService.login(request);

        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        // "Bearer " 접두사 제거
        String jwtToken = token.substring(7);

        // 토큰에서 userEmail 추출
        String userEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);

        log.info("로그아웃요청: userEmail = {}", userEmail);

        authService.logout(userEmail);

        return ResponseEntity.ok("로그아웃이 완료되었습니다.");
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(@RequestParam String refreshToken) {
        log.info("토큰 갱신 요청");

        TokenResponse tokens = tokenService.refreshToken(refreshToken);

        return ResponseEntity.ok(tokens);
    }

}
