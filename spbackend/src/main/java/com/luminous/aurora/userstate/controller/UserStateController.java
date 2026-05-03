package com.luminous.aurora.userstate.controller;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.common.error.exception.ForbiddenException;
import com.luminous.aurora.member.dto.ChannelMemberResponse;
import com.luminous.aurora.member.dto.DmRoomResponse;
import com.luminous.aurora.member.service.MemberService;
import com.luminous.aurora.userstate.dto.*;
import com.luminous.aurora.userstate.entity.UserStatus;
import com.luminous.aurora.userstate.service.UserStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/jv/userstate")
@RequiredArgsConstructor
public class UserStateController {

    private final UserStateService userStateService;
    private final MemberService memberService;

    //사용자 상태 조회
    @GetMapping("/status")
    public ResponseEntity<UserStatusResponse> getCurrentUserStatus(
            @AuthenticationPrincipal Users user) {
        UserStatus status = userStateService.getUserStatus(user.getUserPk());
        UserStatusResponse response = UserStatusResponse.builder()
                .userPk(user.getUserPk())
                .status(status)
                .lastSeen(LocalDateTime.now()) // 실제로는 DB에서 조회
                .build();

        return ResponseEntity.ok(response);
    }


    // 사용자 상태 설정 (의도적 설정)
    @PostMapping("/status")
    public ResponseEntity<UserStatusChangeResponse> setCurrentUserStatus(
            @RequestBody UserStatusChangeRequestForRest request,
            @AuthenticationPrincipal Users user) {
        userStateService.setUserStatus(user.getUserPk(), request.getStatus());

        UserStatusChangeResponse response = UserStatusChangeResponse.builder()
                .userEmail(user.getUserEmail())
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
            @AuthenticationPrincipal Users user) {
        try {

            // 채널 멤버가 아니면 403
            if (!memberService.hasChannelAccess(channelPk, user.getUserPk())) {
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
    public ResponseEntity<List<DmRoomResponse>> getMyDmRooms(@AuthenticationPrincipal Users user) {
        List<DmRoomResponse> dmRooms = userStateService.getDmRoomsWithStatus(user.getUserPk());
        return ResponseEntity.ok(dmRooms);
    }
}