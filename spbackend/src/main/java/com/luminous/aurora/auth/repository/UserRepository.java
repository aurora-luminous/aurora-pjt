package com.luminous.aurora.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.luminous.aurora.auth.entity.Users;

@Repository
public interface UserRepository extends JpaRepository<Users, Integer> {

    // 로그인 시 사용할 메서드
    Optional<Users> findByUserEmail(String userEmail);

    // 회원 가입 시 중복 체크용
    boolean existsByUserEmail(String userEmail);

}
