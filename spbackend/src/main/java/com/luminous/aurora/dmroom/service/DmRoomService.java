package com.luminous.aurora.dmroom.service;

import com.luminous.aurora.dmroom.dto.DmRoomCreateResponse;

public interface DmRoomService {
    // DM 방 생성
    DmRoomCreateResponse createDmRoom(String targetUserEmail, String jwtToken);
}
