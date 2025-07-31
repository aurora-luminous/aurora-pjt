package com.luminous.aurora.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.luminous.aurora.user.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

	// 로그인 시 사용할 메서드
	Optional<User> findByUserId(String userId);

	// 회원 가입 시 중복 체크용
	boolean existsByUserId(String userId);
	boolean existsByUserEmail(String userEmail);

}
