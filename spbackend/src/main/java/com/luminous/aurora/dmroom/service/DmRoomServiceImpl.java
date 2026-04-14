package com.luminous.aurora.dmroom.service;

import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.auth.repository.UserRepository;
import com.luminous.aurora.common.error.exception.BadRequestException;
import com.luminous.aurora.common.error.exception.ConflictException;
import com.luminous.aurora.common.error.exception.NotFoundException;
import com.luminous.aurora.dmroom.dto.DmRoomCreateResponse;
import com.luminous.aurora.dmroom.entity.DmRoom;
import com.luminous.aurora.dmroom.repository.DmRoomRepository;
import com.luminous.aurora.jwt.JwtTokenProvider;
import com.luminous.aurora.member.entity.DmMember;
import com.luminous.aurora.member.repository.DmMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DmRoomServiceImpl implements DmRoomService {

    private final DmRoomRepository dmRoomRepository;
    private final DmMemberRepository dmMemberRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * DM방 생성
     * <p>
     * 호출되는 곳
     * - dmRoomController -> POST /api/jv/dm/rooms
     * <p>
     * 처리 순서:
     * 1. JWT에서 요청자 이메일 추출 -> User 조회
     * 2. 자기 자신에게 DM 시도 시 -> 400 BadRequest
     * 3. targetUserEmail로 상대방 User 조회 -> 없으면 404
     * 4. 두 유저가 이미 같은 DM방에 있는지 확인 -> 있으면 409
     * 5. DmRoom 생성 + DmMember 2명 (요청자, 상대방) 생성
     * 6. DmRoomCreateResponse 반환
     */
    @Override
    @Transactional
    public DmRoomCreateResponse createDmRoom(String targetUserEmail, String jwtToken) {
        // 1. 요청자 조회
        String myEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);
        Users myUser = userRepository.findByUserEmail(myEmail)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        // 2. 자기 자신에게 DM 불가
        if (myEmail.equals(targetUserEmail)) {
            throw new BadRequestException("자기 자신에게 DM을 보낼 수 없습니다.");
        }

        // 3. 상대방 조회
        Users targetUser = userRepository.findByUserEmail(targetUserEmail)
                .orElseThrow(() -> new NotFoundException("해당 사용자를 찾을 수 없습니다."));

        // 4. 기존 DM 방 존재 여부 확인
        dmMemberRepository.findExistingDmRoom(myUser.getUserPk(), targetUser.getUserPk())
                .ifPresent(room -> {
                    throw new ConflictException("이미 해당 사용자와의 DM 방이 존재합니다.");
                });

        // 5. DmRoom + DmMember 2명 생성
        DmRoom dmRoom = DmRoom.builder()
                .createdAt(LocalDateTime.now())
                .build();

        dmRoomRepository.save(dmRoom);

        dmMemberRepository.save(DmMember.builder()
                .dmRoom(dmRoom)
                .user(myUser)
                .isMute(false)
                .build());
        dmMemberRepository.save(DmMember.builder()
                .dmRoom(dmRoom).user(targetUser).isMute(false).build());

        log.info("DM방 생성: dmRoomPk = {}, user1 = {}, user2 = {}",
                dmRoom.getDmRoomPk(), myEmail, targetUserEmail);

        // 6. 응답
        return DmRoomCreateResponse.builder()
                .dmRoomPk(dmRoom.getDmRoomPk())
                .targetUserEmail(targetUserEmail)
                .targetUserName(targetUser.getUserName())
                .targetUserProfileImage(targetUser.getProfileImagePath())
                .build();

    }

    /**
     * 특정 상대방과의 기존 DM 방 조회
     * 호출 되는 곳 :
     * - DmRoomController → GET /api/jv/dm/rooms/by-user
     *
     * 처리 순서:
     * 1. JWT 에서 요청자 이메일 추출 -> Users 조회
     * 2. targetUserEmail로 상대방 Users 조회 -> 없으면 404
     * 3. 두 유저가 같은 DM 방에 있는지 확인 -> 없으면 404
     * 4. DmRoomCreate 반환
     *
     */
    @Override
    public DmRoomCreateResponse getDmRoomByUser(String targetUserEmail, String jwtToken) {
        String myEmail = jwtTokenProvider.getUserEmailFromToken(jwtToken);

        Users myUser = userRepository.findByUserEmail(myEmail)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        Users targetUser = userRepository.findByUserEmail(targetUserEmail)
                .orElseThrow(() -> new NotFoundException("해당 사용자를 찾을 수 없습니다."));

        DmRoom dmRoom = dmMemberRepository.findExistingDmRoom(
                myUser.getUserPk(), targetUser.getUserPk())
                .orElseThrow(() -> new NotFoundException("해당 사용자와의 DM 방이 존재하지 않습니다."));

        return DmRoomCreateResponse.builder()
                .dmRoomPk(dmRoom.getDmRoomPk())
                .targetUserEmail(targetUserEmail)
                .targetUserName(targetUser.getUserName())
                .targetUserProfileImage(targetUser.getProfileImagePath())
                .build();

    }
}
