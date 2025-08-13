package com.luminous.aurora.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.luminous.aurora.auth.entity.Users;

@Repository
public interface UserRepository extends JpaRepository<Users, Integer> {

    // 로그인 시 사용할 메서드
    Optional<Users> findByUserEmail(String userEmail);

    // 회원 가입 시 중복 체크용
    boolean existsByUserEmail(String userEmail);

    // user Email로 user pk 조회용
    @Query("SELECT u.userPk FROM Users u WHERE u.userEmail = :userEmail")
    Optional<Integer> findUserPkByUserEmail(@Param("userEmail") String userEmail);
}
