package com.luminous.aurora.chat.repository;

import com.luminous.aurora.chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // 채널별 메시지 최신 메시지 조회 (처음 로드 시) 리미트 수 만큼 최초 로드시 보여줌, 일단 20개
    @Query("SELECT m FROM Message m WHERE m.channelPk.channelPk = :channelPk ORDER BY m.createdAt DESC LIMIT 40")
    List<Message> findLatestMessagesByChannelPk(@Param("channelPk") Integer channelPk);

    // 채널별 이전 메시지 조회 (스크롤 시)
    @Query("SELECT m FROM Message m WHERE m.channelPk.channelPk = :channelPk AND m.createdAt < :lastMessageTime ORDER BY m.createdAt DESC LIMIT 40")
    List<Message> findOlderMessagesByChannelPk(@Param("channelPk") Integer channelPk,
                                               @Param("lastMessageTime") LocalDateTime lastMessageTime);

    // DM 방별 최신 메시지 조회
    @Query("SELECT m FROM Message m WHERE m.dmRoomPk.dmRoomPk = :dmRoomPk ORDER BY m.createdAt DESC LIMIT 40")
    List<Message> findLatestMessagesByDmRoomPk(@Param("dmRoomPk") Integer dmRoomPk);

    // DM 방별 이전 메시지 조회
    @Query("SELECT m FROM Message m WHERE m.dmRoomPk.dmRoomPk = :dmRoomPk AND m.createdAt < :lastMessageTime ORDER BY m.createdAt DESC LIMIT 40")
    List<Message> findOlderMessagesByDmRoomPk(@Param("dmRoomPk") Integer dmRoomPk,
                                              @Param("lastMessageTime") LocalDateTime lastMessageTime);

    // 사용자가 쓴 메시지 조회
    List<Message> findByUserPk_UserPkOrderByCreatedAtDesc(Integer userPk);

    // 채널에 메시지가 1개라도 있는지 확인 (안읽은 메시지 확인용 - lastReadMessage = null 이면 아직 하나도 안읽은건지, 진짜 메시지가 없는건지 체크)
    boolean existsByChannelPk_ChannelPk(Integer channelPk);


    // 채널 around용 메서드 3개

    // 1. 기준 메시지가 해당 채널에 있는지 확인하는 앵커
    Optional<Message> findByMessagePkAndChannelPk_ChannelPk(Long messagePk, Integer channelPk);

    // 2. 기준 보다 작은 Pk중 최대 20개 - 최신쪽 부터 가져온 뒤 서비스에서 리스트를 뒤집어 시간/pk 오름차순으로 맞춘다.
    @Query("SELECT m FROM Message m WHERE m.channelPk.channelPk = :channelPk AND m.messagePk < :anchorPk ORDER BY m.messagePk DESC LIMIT 20")
    List<Message> findChannelMessagesStrictlyOlderThan(@Param("channelPk") Integer channelPk,
                                                       @Param("anchorPk") Long anchorPk);

    // 3. 기준보다 큰 Pk 중 최대 20개 - 오름차순 그대로
    @Query("SELECT m FROM Message m WHERE m.channelPk.channelPk = :channelPk AND m.messagePk > :anchorPk ORDER BY m.messagePk LIMIT 20")
    List<Message> findChannelMessagesStrictlyNewerThan(@Param("channelPk") Integer channelPk,
                                                      @Param("anchorPk") Long anchorPk);

    // 채널 newer 메시지 쿼리 (내가 마지막으로 본 메세지보다 이후 온 메시지 40개)
    @Query("SELECT m FROM Message m WHERE m.channelPk.channelPk = :channelPk AND m.messagePk > :afterMessagePk ORDER BY m.messagePk LIMIT 40")
    List<Message> findChannelMessagesNewerThanAfterPk(@Param("channelPk") Integer channelPk,
                                                      @Param("afterMessagePk") Long afterMessagePk);

    // ================ DM around ==============

    // DM 방에서 기준 메시지 1건
    Optional<Message> findByMessagePkAndDmRoomPk_DmRoomPk(Long messagePk, Integer dmRoomPk);

    // 기준 messagePk보다 작은 PK 중, 큰 쪽부터 최대 20개 (DESC). 서비스에서 reverse 하면 오름차순.
    @Query("SELECT m FROM Message m WHERE m.dmRoomPk.dmRoomPk = :dmRoomPk AND m.messagePk < :anchorPk ORDER BY m.messagePk DESC LIMIT 20")
    List<Message> findDmMessagesStrictlyOlderThan(@Param("dmRoomPk") Integer dmRoomPk,
                                                  @Param("anchorPk") Long anchorPk);
    // 기준 messagePk보다 큰 PK 중 오름차순 최대 20개
    @Query("SELECT m FROM Message m WHERE m.dmRoomPk.dmRoomPk = :dmRoomPk AND m.messagePk > :anchorPk ORDER BY m.messagePk LIMIT 20")
    List<Message> findDmMessagesStrictlyNewerThan(@Param("dmRoomPk") Integer dmRoomPk,
                                                  @Param("anchorPk") Long anchorPk);

    // DM방의 가장 최신 메시지 1개 조회(마지막 메시지 미리보기용)
    @Query("SELECT m FROM Message m " +
            "WHERE m.dmRoomPk.dmRoomPk = :dmRoomPk " +
            "ORDER BY m.createdAt DESC LIMIT 1")
    Optional<Message> findLatestMessageInDmRoom(@Param("dmRoomPk") Integer dmRoomPk);

    // DM용 읽지 않은 메시지 개수 (내가 보낸것 제외)
    @Query("SELECT COUNT(m) FROM Message m " +
            "WHERE m.dmRoomPk.dmRoomPk = :dmRoomPk " +
            "AND m.messagePk > :lastReadMessagePk " +
            "AND m.userPk.userPk != :myUserPk")
    Long countUnreadMessages(
            @Param("dmRoomPk") Integer DmRoomPk,
            @Param("lastReadMessagePk") Long lastReadMessagePk,
            @Param("myUserPk") Integer myUserPk
    );

    // 채널용 채널에서 안 읽은 메시지 존재 여부 확인(내가 보낸 것 제외)
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Message m " +
            "WHERE m.channelPk.channelPk = :channelPk " +
            "AND m.messagePk > :lastReadMessagePk " +
            "AND m.userPk.userPk != :myUserPk")
    boolean existsUnreadMessages(
            @Param("channelPk") Integer channelPk,
            @Param("lastReadMessagePk") Long lastReadMessagePk,
            @Param("myUserPk") Integer myUserPk
    );
}

