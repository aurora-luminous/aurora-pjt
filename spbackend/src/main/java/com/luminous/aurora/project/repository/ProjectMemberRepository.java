package com.luminous.aurora.project.repository;

import com.luminous.aurora.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Integer> {
    List<ProjectMember> findByProject_ProjectPkAndProjectRole(Integer projectPk, String role);
    List<ProjectMember> findByProject_ProjectPk(Integer projectPk);

    /**
     * 프로젝트 멤버 여부 확인 (IDOR 방지용)
     * - projectPk, userPk 조합이 ProjectMember 테이블에 존재하는지 조회
     */
    boolean existsByProject_ProjectPkAndUser_UserPk(Integer projectPk, Integer userPk);
}
