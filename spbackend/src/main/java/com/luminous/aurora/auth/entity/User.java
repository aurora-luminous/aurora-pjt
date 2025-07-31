package com.luminous.aurora.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long userPk;
	private String userId;
	private String userEmail;
	private String userName;
	private String password;
	private Boolean isDeleted;
	private String profileImagePath;

	@CreationTimestamp
	@Column(updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	private LocalDateTime updatedAt;

	@PrePersist //실행 시점: 엔티티가 데이터베이스에 저장되기 직전 -> 저장전 필요한 초기화 작업 수행
	protected void onCreate() {
		if (isDeleted == null) {
			isDeleted = false; // 기본값 설정
		}
		if (userName ==null || userName.isEmpty()) {
			userName = "익명"; // 기본값 설정
		}
	}
}
