package com.luminous.aurora.dmroom.service;

import com.luminous.aurora.dmroom.dto.DmRoomCreateResponse;

public interface DmRoomService {
    // DM 방 생성
    DmRoomCreateResponse createDmRoom(String targetUserEmail, Integer userPk);

    // 특정 상대방과의 DM 방 조회
    // 생성때와 같은 양식으로 주기때문에 CreateResponse 재활용
    DmRoomCreateResponse getDmRoomByUser(String targetUserEmail, Integer userPk);
}
