package com.luminous.aurora.dmroom.controller;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.dmroom.dto.DmRoomCreateRequest;
import com.luminous.aurora.dmroom.dto.DmRoomCreateResponse;
import com.luminous.aurora.dmroom.service.DmRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/jv/dm")
@RequiredArgsConstructor
public class DmRoomController {

    private final DmRoomService dmRoomService;

    /**
     * DM방 생성
     * - 상대방 이메일로 DM방 생성
     * - 이미 존재하면 409 Conflict
     * - 자기 자신이면 400 BadRequest
     */
    @PostMapping("/rooms")
    public ResponseEntity<DmRoomCreateResponse> createDmRoom(
            @RequestBody DmRoomCreateRequest request,
            @AuthenticationPrincipal Users user) {
        DmRoomCreateResponse response = dmRoomService.createDmRoom(
                request.getTargetUserEmail(), user.getUserPk());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 특정 상대방과의 기존 DM방 조회
     * - 존재하면 200 -> DM방 정보
     * - 없으면 404
     */
    @GetMapping("/rooms/by-user")
    public ResponseEntity<DmRoomCreateResponse> getDmRoomByUser(
            @RequestParam String targetUserEmail,
            @AuthenticationPrincipal Users user) {
        DmRoomCreateResponse response = dmRoomService.getDmRoomByUser(
                targetUserEmail, user.getUserPk());

        return ResponseEntity.ok(response);
    }
}
