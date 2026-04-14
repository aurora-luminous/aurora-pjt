package com.luminous.aurora.dmroom.controller;

import com.luminous.aurora.common.error.exception.UnauthorizedException;
import com.luminous.aurora.dmroom.dto.DmRoomCreateRequest;
import com.luminous.aurora.dmroom.dto.DmRoomCreateResponse;
import com.luminous.aurora.dmroom.service.DmRoomService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            HttpServletRequest httpRequest) {
        String token = extractTokenFromCookie(httpRequest);
        DmRoomCreateResponse response = dmRoomService.createDmRoom(
                request.getTargetUserEmail(), token);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     *
     */
    @GetMapping("/rooms/by-user")
    public ResponseEntity<DmRoomCreateResponse> getDmRoomByUser(
            @RequestParam String targetUserEmail,
            HttpServletRequest httpRequest) {
        String token = extractTokenFromCookie(httpRequest);
        DmRoomCreateResponse response = dmRoomService.getDmRoomByUser(
                targetUserEmail, token);

        return ResponseEntity.ok(response);
    }

    /**
     * 쿠키에서 access_token 추출
     * - 토큰 없으면 UnauthorizedException → 401
     * <p>
     * TODO : 지금 이거 컨트롤러별로 쓰고 있는데 공용 유틸로 빼기
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
