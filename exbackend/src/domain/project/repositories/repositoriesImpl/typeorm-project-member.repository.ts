import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { ProjectMember } from '../../entities/project-member.entity';
import { ProjectMemberRepository } from '../project-member.repository';
import { MemberStatus, MemberRole } from 'src/common/enums';
import { EntityManager } from 'typeorm';

@Injectable()
export class TypeOrmProjectMemberRepository extends ProjectMemberRepository {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {
    super();
  }

  // 프로젝트 멤버 조회
  async findOne(
    options: {
      projectPk?: number;
      userPk?: number;
      projectMemberPk?: number;
      pStatus?: MemberStatus;
    },
    relations?: string[],
  ): Promise<ProjectMember | null> {
    const { projectPk, userPk, projectMemberPk, pStatus } = options;

    return this.projectMemberRepository.findOne({
      where: {
        ...(projectPk && { projectPk }),
        ...(userPk && { userPk }),
        ...(projectMemberPk && { projectMemberPk }),
        ...(pStatus && { pStatus: pStatus }),
      },
      relations: relations || [],
    });
  }

  // 프로젝트 참가 중인 멤버 목록 조회
  async findMembersByProject(projectPk: number): Promise<ProjectMember[]> {
    return this.projectMemberRepository.find({
      where: {
        projectPk,
        pStatus: MemberStatus.ACTIVE,
      },
      relations: ['user'],
    });
  }

  // 유저가 참가 중인 모든 프로젝트들 조회
  async findActiveMemberByUser(userPk: number): Promise<ProjectMember[]> {
    return this.projectMemberRepository.find({
      where: {
        userPk,
        pStatus: MemberStatus.ACTIVE,
      },
      relations: ['project'],
    });
  }

  // 프로젝트 멤버 저장(생성, 권한 변경 등의 업데이트)
  async save(member: Partial<ProjectMember>): Promise<ProjectMember> {
    return this.projectMemberRepository.save(member);
  }

  // 프로젝트 삭제 시 멤버들의 상태 일괄 변경
  async updateStatusByProject(
    projectPk: number,
    newStatus: MemberStatus,
    oldStatus?: MemberStatus,
  ): Promise<void> {
    const whereCondition = {
      projectPk,
      ...(oldStatus && { pStatus: oldStatus }),
    };

    await this.projectMemberRepository.update(whereCondition, {
      pStatus: newStatus,
    });
  }

  // 프로젝트 관리자 수 체크
  async countProjectManagers(projectPk: number): Promise<number> {
    return await this.projectMemberRepository.count({
      where: {
        projectPk,
        pStatus: MemberStatus.ACTIVE,
        projectRole: MemberRole.ADMIN,
      }
    })
  }
  
  // 유저가 마지막으로 접속한 채널 조회
  async findLastConnectedWithServer(userPk: number): Promise<ProjectMember | null> {
    return this.projectMemberRepository.findOne({
      where: {
        userPk,
        pStatus: MemberStatus.ACTIVE,
        lastConnectedChannel: Not(IsNull()),
      },
      relations: ['project', 'project.server'],
      order: {
        lastConnectedTime: 'DESC',
      },
    });
  }

  // 유저가 가입한 서버에서 모든 프로젝트 나가기 처리
  async deactivateUserInServer(manager: EntityManager, serverPk: number, userPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ProjectMember)
      .set({ pStatus: MemberStatus.INACTIVE })
      .where('userPk = :userPk', { userPk })
      .andWhere('pStatus = :status', { status: MemberStatus.ACTIVE })
      .andWhere('projectPk IN (SELECT project_pk FROM project WHERE server_pk = :serverPk)', { serverPk })
      .execute();
  }

  // 서버의 프로젝트 멤버 모두 나가기 처리
  async deactivateAllByServer(manager: EntityManager, serverPk: number): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ProjectMember)
      .set({ pStatus: MemberStatus.INACTIVE })
      .where('pStatus = :status', { status: MemberStatus.ACTIVE })
      .andWhere('projectPk IN (SELECT project_pk FROM project WHERE server_pk = :serverPk)', { serverPk })
      .execute();
  }

  // 프로젝트 멤버 저장(Manager를 넘겨서 트랜잭션 안끊기게 하는 메서드)
  async addMember(manager: EntityManager, projectPk: number, userPk: number): Promise<void> {
    const repo = manager.getRepository(ProjectMember);

    const existing = await repo.findOne({ where: { projectPk, userPk } });

    if (!existing) {
      await repo.save({
        projectPk,
        userPk,
        pStatus: MemberStatus.ACTIVE,
        projectRole: MemberRole.MEMBER,
      })
    } else if (existing.pStatus !== MemberStatus.ACTIVE) {
      existing.pStatus = MemberStatus.ACTIVE;
      await repo.save(existing);
    }
  }
}
