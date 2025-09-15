package com.luminous.aurora.userstate.controller;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.project.entity.ProjectMember;
import com.luminous.aurora.userstate.dto.UserStatusChangeRequest;
import com.luminous.aurora.userstate.dto.UserStatusChangeRequestForRest;
import com.luminous.aurora.userstate.dto.UserStatusChangeResponse;
import com.luminous.aurora.userstate.dto.UserStatusResponse;
import com.luminous.aurora.userstate.entity.UserStatus;
import com.luminous.aurora.userstate.service.UserStateService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("jv/api/userstate")
@RequiredArgsConstructor
public class UserStateController {

    private final UserStateService userStateService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;


    //사용자 상태 조회
    @GetMapping("/status")
    public ResponseEntity<UserStatusResponse> getCurrentUserStatus(
            HttpServletRequest request) {
        try {
            Integer userPk = extractUserPkFromRequest(request);
            UserStatus status = userStateService.getUserStatus(userPk);

            UserStatusResponse response = UserStatusResponse.builder()
                    .userPk(userPk)
                    .status(status)
                    .lastSeen(LocalDateTime.now()) // 실제로는 DB에서 조회
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }


    // 사용자 상태 설정 (의도적 설정)
    @PostMapping("/status")
    public ResponseEntity<UserStatusChangeResponse> setCurrentUserStatus(
            @RequestBody UserStatusChangeRequestForRest request,
            HttpServletRequest httpRequest) {
        try {
            Integer userPk = extractUserPkFromRequest(httpRequest);
            userStateService.setUserStatus(userPk, request.getStatus());

            UserStatusChangeResponse response = UserStatusChangeResponse.builder()
                    .userPk(userPk)
                    .status(request.getStatus())
                    .timestamp(System.currentTimeMillis())
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    // ========== 프로젝트 멤버 조회 ==========


    // 프로젝트 멤버 조회 (권한별 + 상태별 + 가나다순)

    @GetMapping("/project/{projectPk}/members")
    public ResponseEntity<List<ProjectMember>> getProjectMembers(
            @PathVariable Integer projectPk) {
        List<ProjectMember> members = userStateService.getProjectMembersWithStatus(projectPk);
        return ResponseEntity.ok(members);
    }


    // ========== DM 멤버 조회 ==========

    // DM 멤버 조회 (최신순)

    @GetMapping("/dm/{dmRoomPk}/members")
    public ResponseEntity<List<DmMember>> getDmMembers(
            @PathVariable Integer dmRoomPk) {
        List<DmMember> members = userStateService.getDmMembers(dmRoomPk);
        return ResponseEntity.ok(members);
    }


    private Integer extractUserPkFromRequest(HttpServletRequest request) {
        // JWT 토큰 추출 및 userPk 반환
        String token = extractTokenFromCookie(request);
        String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
        return userRepository.findUserPkByUserEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        throw new RuntimeException("JWT 토큰을 찾을 수 없습니다.");
    }
}