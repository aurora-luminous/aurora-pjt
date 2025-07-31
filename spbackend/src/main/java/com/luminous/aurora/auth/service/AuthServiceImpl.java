package com.luminous.aurora.auth.service;


import com.luminous.aurora.auth.dto.LoginRequest;
import com.luminous.aurora.auth.dto.SignUpRequest;
import com.luminous.aurora.auth.dto.TokenResponse;
import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public TokenResponse login(LoginRequest request) {

        // userEmail로 사용자 조회
        Users users = userRepository.findByUserEmail(request.getUserEmail())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자 입니다."));

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), users.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        // userEmail로 토큰 생성
        TokenResponse tokens = tokenService.generateTokens(users.getUserEmail());

        log.info("로그인 성공: userEmail ={}", users.getUserEmail());

        return tokens;
    }

    @Override
    @Transactional
    public void signUp(SignUpRequest request) {

        // 중복체크
        if (userRepository.existsByUserEmail(request.getUserEmail())) {
            throw new RuntimeException("이미 존재하는 이메일 입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 사용자 생성

        Users users = Users.builder()
                .userEmail(request.getUserEmail())
                .userName(request.getUserName())
                .password(encodedPassword)
                .isDeleted(false)
                .build();

        userRepository.save(users);

        log.info("회원가입 성공: userEmail = {}", users.getUserEmail());
    }

    @Override
    public void logout(String userEmail) {
        tokenService.logout(userEmail);
        log.info("로그아웃 완료: userEmail ={}",userEmail);
    }
}
