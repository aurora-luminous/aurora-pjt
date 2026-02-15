package com.luminous.aurora.userstate.controller;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.common.error.exception.*;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.dto.DmRoomResponse;
import com.luminous.aurora.project.entity.ProjectMember;
import com.luminous.aurora.userstate.dto.*;
import com.luminous.aurora.userstate.entity.UserStatus;
import com.luminous.aurora.userstate.service.UserStateService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/jv/userstate")
@RequiredArgsConstructor
public class UserStateController {

    private final UserStateService userStateService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    //사용자 상태 조회
    @GetMapping("/status")
    public ResponseEntity<UserStatusResponse> getCurrentUserStatus(
            HttpServletRequest request) {
        Integer userPk = extractUserPkFromRequest(request);
        UserStatus status = userStateService.getUserStatus(userPk);
        UserStatusResponse response = UserStatusResponse.builder()
                .userPk(userPk)
                .status(status)
                .lastSeen(LocalDateTime.now()) // 실제로는 DB에서 조회
                .build();

        return ResponseEntity.ok(response);
    }


    // 사용자 상태 설정 (의도적 설정)
    @PostMapping("/status")
    public ResponseEntity<UserStatusChangeResponse> setCurrentUserStatus(
            @RequestBody UserStatusChangeRequestForRest request,
            HttpServletRequest httpRequest) {
        Integer userPk = extractUserPkFromRequest(httpRequest);
        userStateService.setUserStatus(userPk, request.getStatus());

        UserStatusChangeResponse response = UserStatusChangeResponse.builder()
                .userPk(userPk)
                .status(request.getStatus())
                .timestamp(System.currentTimeMillis())
                .build();

        return ResponseEntity.ok(response);
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

    @GetMapping("/dm/rooms")
    public ResponseEntity<List<DmRoomResponse>> getMyDmRooms(HttpServletRequest request) {
        Integer userPk = extractUserPkFromRequest(request);
        List<DmRoomResponse> dmRooms = userStateService.getDmRoomsWithStatus(userPk);
        return ResponseEntity.ok(dmRooms);
    }


    /**
     * Express에서 멤버 변경 시 호출하는 API
     */
    @PostMapping("/member/notify")
    public ResponseEntity<String> notifyMemberChange(@RequestBody MemberChangeEvent event) {
        // 프로젝트 멤버 변경만 처리
        if (event.getProjectPk() == null) {
            throw new BadRequestException("프로젝트 정보가 필요합니다.");
        }

        String destination = "/topic/project/" + event.getProjectPk() + "/members";

        // WebSocket으로 브로드캐스트
        messagingTemplate.convertAndSend(destination, event);

        log.info("프로젝트 멤버 변경 알림 전송: eventType={}, projectPk={}, userPk={}",
                event.getEventType(), event.getProjectPk(), event.getUserPk());

        return ResponseEntity.ok("알림 전송 완료");

    }

    /**
     * JWT에서 userPk 추출
     * - 토큰/사용자 없으면 UnauthorizedException → 401
     */
    private Integer extractUserPkFromRequest(HttpServletRequest request) {
        // JWT 토큰 추출 및 userPk 반환
        String token = extractTokenFromCookie(request);
        String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
        return userRepository.findUserPkByUserEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
    }

    /**
     * 쿠키에서 access_token 추출
     * - 토큰 없으면 UnauthorizedException → GlobalExceptionHandler가 401 반환
     */
    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        throw new UnauthorizedException("JWT 토큰을 찾을 수 없습니다.");
    }
}