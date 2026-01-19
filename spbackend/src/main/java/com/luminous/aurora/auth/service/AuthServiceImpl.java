package com.luminous.aurora.auth.service;


import com.luminous.aurora.auth.dto.AuthInfo;
import com.luminous.aurora.auth.dto.LoginRequest;
import com.luminous.aurora.auth.dto.SignUpRequest;
import com.luminous.aurora.auth.dto.TokenResponse;
import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.common.error.exception.BadRequestException;
import com.luminous.aurora.common.error.exception.ConflictException;
import com.luminous.aurora.common.error.exception.InternalServerErrorException;
import com.luminous.aurora.common.error.exception.NotFoundException;
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

        try {
            // userEmail로 사용자 조회
            Users users = userRepository.findByUserEmail(request.getUserEmail())
                    .orElseThrow(() -> new NotFoundException("존재하지 않는 사용자 입니다."));

            // 비밀번호 검증
            if (!passwordEncoder.matches(request.getPassword(), users.getPassword())) {
                throw new BadRequestException("비밀번호가 일치하지 않습니다.");
            }

            // userEmail로 토큰 생성
            TokenResponse tokens = tokenService.generateTokens(users.getUserEmail());

            log.info("로그인 성공: userEmail ={}", users.getUserEmail());

            return tokens;
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("로그인 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("로그인 처리 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }

    }

    @Override
    @Transactional
    public void signUp(SignUpRequest request) {
        try {
            // 중복체크
            if (userRepository.existsByUserEmail(request.getUserEmail())) {
                throw new ConflictException("이미 존재하는 이메일 입니다.");
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
        } catch (NotFoundException | BadRequestException | ConflictException e) {
            throw e;
        } catch (Exception e) {
            log.error("회원 가입 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("회원가입 처리 중 서버 오류가 발생했습니다 : " + e.getMessage());
        }
    }

    @Override
    public void logout(String userEmail) {
        try {
            tokenService.logout(userEmail);
            log.info("로그아웃 완료: userEmail ={}", userEmail);
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("로그아웃 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("로그아웃 처리 중 서버 오류가 발생했습니다. : " + e.getMessage());
        }
    }

    @Override
    public AuthInfo getUserInfo(String userEmail) {
        try {
            Users user = userRepository.findByUserEmail(userEmail)
                    .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

            return AuthInfo.builder()
                    .userName(user.getUserName())
                    .userEmail(user.getUserEmail())
                    .profileImagePath(user.getProfileImagePath())
                    .build();
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패 : {}", e.getMessage());
            throw new InternalServerErrorException("사용자를 찾는 시도 중 서버 오류가 발생했습니다 : " + e.getMessage());
        }

    }
}
