package com.luminous.aurora.project.repository;

import com.luminous.aurora.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Integer> {
    List<ProjectMember> findByProject_ProjectPkAndProjectRole(Integer projectPk, String role);
    List<ProjectMember> findByProject_ProjectPk(Integer projectPk);
}
