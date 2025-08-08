package com.luminous.aurora.chat.repository;

import com.luminous.aurora.chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // 채널별 메시지 최신 메시지 조회 (처음 로드 시) 리미트 수 만큼 최초 로드시 보여줌, 일단 20개
    @Query("SELECT m FROM Message m WHERE m.channelPk = :channelPk ORDER BY m.createdAt DESC LIMIT 20")
    List<Message> findLatestMessagesByChannelPk(@Param("channelPk") Integer channelPk);

    // 채널별 이전 메시지 조회 (스크롤 시)
    @Query("SELECT m FROM Message m WHERE m.channelPk = :channelPk AND m.createdAt < :lastMessageTime ORDER BY m.createdAt DESC LIMIT 20")
    List<Message> findOlderMessagesByChannelPk(@Param("channelPk") Integer channelPk,
                                               @Param("lastMessageTime")LocalDateTime lastMessageTime);

    // DM 방별 최신 메시지 조회
    @Query("SELECT m FROM Message m WHERE m.dmRoomPk = :dmRoomPk ORDER BY m.createdAt DESC LIMIT 20")
    List<Message> findLatestMessagesByDmRoomPk(@Param("dmRoomPk") Integer dmRoomPk);

    // DM 방별 이전 메시지 조회
    @Query("SELECT m FROM Message m WHERE m.dmRoomPk = :dmRoomPk AND m.createdAt < :lastMessageTime ORDER BY m.createdAt DESC LIMIT 20")
    List<Message> findOlderMessagesByDmRoomPk(@Param("dmRoomPk") Integer dmRoomPk,
                                             @Param("lastMessageTime") LocalDateTime lastMessageTime);

    // 사용자가 쓴 메시지 조회
    List<Message> findByUserPkOrderByCreatedAtDesc(Integer userPk);
}
