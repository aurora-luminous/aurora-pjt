import { ProjectMember } from '../entities/project-member.entity';
import { MemberStatus } from "src/common/enums";
import { EntityManager } from 'typeorm';

export abstract class ProjectMemberRepository {
  // 프로젝트 멤버 조회
  abstract findOne(
    options: {
      projectPk?: number;
      userPk?: number;
      projectMemberPk?: number;
      pStatus?: MemberStatus;
    },
    relations?: string[],
  ): Promise<ProjectMember | null>;

  // 프로젝트 참가 중인 멤버 목록 조회
  abstract findMembersByProject(projectPk: number): Promise<ProjectMember[]>;

  // 프로젝트 멤버 저장(생성, 권한 변경 등의 업데이트)
  abstract save(member: Partial<ProjectMember>): Promise<ProjectMember>;

  // 프로젝트 삭제 시 멤버들의 상태 일괄 변경
  abstract updateStatusByProject(
    projectPk: number,
    newStatus: MemberStatus,
    oldStatus?: MemberStatus,
  ): Promise<void>;

  // 프로젝트 관리자 수 체크
  abstract countProjectManagers(projectPk: number): Promise<number>;

  // 유저가 마지막으로 접속한 채널 조회
  abstract findLastConnectedWithServer(userPk: number): Promise<ProjectMember | null>;

  // 유저가 가입한 서버에서 모든 프로젝트 나가기 처리
  abstract deactivateUserInServer(manager: EntityManager, serverPk: number, userPk: number): Promise<void>;

  // 특정 서버의 모든 프로젝트 멤버 나가기 처리
  abstract deactivateAllByServer(manager: EntityManager, serverPk: number): Promise<void>;
}
