package com.luminous.aurora.userstate.controller;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.member.dto.ChannelMemberResponse;
import com.luminous.aurora.member.dto.DmRoomResponse;
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
     */
    @GetMapping("/channel/{channelPk}/members")
    public ResponseEntity<List<ChannelMemberResponse>> getChannelMembers(
            @PathVariable Integer channelPk,
            @AuthenticationPrincipal Users user) {
        List<ChannelMemberResponse> members = userStateService.getChannelMemberWithStatus(channelPk, user.getUserPk());

        return ResponseEntity.ok(members);
    }


    // ========== DM 멤버 조회 ==========

    // DM 멤버 조회 (최신순)

    @GetMapping("/dm/rooms")
    public ResponseEntity<List<DmRoomResponse>> getMyDmRooms(@AuthenticationPrincipal Users user) {
        List<DmRoomResponse> dmRooms = userStateService.getDmRoomsWithStatus(user.getUserPk());
        return ResponseEntity.ok(dmRooms);
    }
}