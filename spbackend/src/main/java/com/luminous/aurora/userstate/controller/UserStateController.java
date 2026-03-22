package com.luminous.aurora.userstate.controller;

import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.common.error.exception.*;
import com.luminous.aurora.common.error.exception.ForbiddenException;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.dto.ChannelMemberResponse;
import com.luminous.aurora.member.dto.DmRoomResponse;
import com.luminous.aurora.member.service.MemberService;
import com.luminous.aurora.userstate.dto.*;
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
@RequestMapping("/api/jv/userstate")
@RequiredArgsConstructor
public class UserStateController {

    private final UserStateService userStateService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final MemberService memberService;

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

    // ========== 채널 멤버 조회 ==========

    /**
     * 채널 멤버 조회 (권한별 + 상태별 + 가나다순)
     * - IDOR 방지 : 채널 멤버인지 검증 후 조회
     * - 미멤버 요청 시 403 Forbidden
     */
    @GetMapping("/channel/{channelPk}/members")
    public ResponseEntity<List<ChannelMemberResponse>> getChannelMembers(
            @PathVariable Integer channelPk,
            HttpServletRequest request) {
        try {
            // JWT에서 현재 사용자 PK 추출
            Integer userPk = extractUserPkFromRequest(request);

            // 채널 멤버가 아니면 403
            if (!memberService.hasChannelAccess(channelPk, userPk)) {
                throw new ForbiddenException("해당 채널에 접근할 권한이 없습니다.");
            }
            List<ChannelMemberResponse> members = userStateService.getChannelMemberWithStatus(channelPk);

            return ResponseEntity.ok(members);
        } catch (ForbiddenException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
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