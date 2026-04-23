import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  MemberRole,
  ServerRoleUtils,
} from '../../../../common/enums/member-role.enum';
import {
  MemberStatus,
  ServerMemberStatus,
  MemberStatusUtils,
} from '../../../../common/enums/member-status.enum';
import { ServerRolePermissionService } from '../server-role-permission.service';
import { UserRepository } from 'src/domain/user/repositories/user.repository';
import { ServerRepository } from '../../repositories/server.repository';
import { ServerMemberRepository } from '../../repositories/server-member.repository';
import { ProjectRepository } from 'src/domain/project/repositories/project.repository';
import { ProjectMemberRepository } from 'src/domain/project/repositories/project-member.repository';
import { ChannelRepository } from 'src/domain/channel/repositories/channel.repository';
import { ChannelMemberRepository } from 'src/domain/channel/repositories/channel-member.repository';
import { ServerMemberManagementService } from '../server-member-management.service';
import {
  PendingMemberDto,
  UpdateMemberStatusDto,
  BulkOperationResult,
} from '../../dto';

@Injectable()
export class ServerMemberManagementServiceImpl extends ServerMemberManagementService {
  constructor(
     private readonly serverRepository: ServerRepository,
     private readonly serverMemberRepository: ServerMemberRepository,
     private readonly userRepository: UserRepository,
     private readonly projectRepository: ProjectRepository,
     private readonly projectMemberRepository: ProjectMemberRepository,
     private readonly channelRepository: ChannelRepository,
     private readonly channelMemberRepository: ChannelMemberRepository,
     private readonly serverRolePermissionService: ServerRolePermissionService,
     private readonly dataSource: DataSource,
  ) {
    super();
  }

  // 서버 승인 대기 목록 조회
  async getPendingMembers(
    serverPk: number,
    requestUserPk: number,
  ): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인

    const server = await this.serverRepository.findOne({ serverPk });

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다.`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({ serverPk, userPk: requestUserPk });

    if (
      !requestMember ||
      !ServerRoleUtils.hasAdminPermission(requestMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 대기 중인 멤버를 볼 수 있습니다',
      );
    }

    // 3. 대기 중인 멤버 목록 조회
    const pendingMembers = await this.serverMemberRepository.findAll(
      { serverPk, sStatus: 'Pending' },
      ['user'],
      { serverMemberPk: 'ASC' }, // 신청 순서대로
    );

    return pendingMembers.map((member) => ({
      sStatus: member.sStatus,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // 서버 가입 승인/거절
  async updateMemberStatus(
    serverMemberPk: number,
    updateDto: UpdateMemberStatusDto,
  ): Promise<PendingMemberDto> {
    // 1. 서버 멤버 존재 확인
    const serverMember = await this.serverMemberRepository.findOne(
      { serverMemberPk },
      ['user', 'server'],
    );

    if (!serverMember) {
      throw new NotFoundException(
        `서버 멤버 ID ${serverMemberPk}를 찾을 수 없습니다`,
      );
    }

    // 2. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne(
      {
        serverPk: serverMember.serverPk,
        userPk: updateDto.adminUserPk,
        sStatus: 'Active',
      },
    );

    if (
      !adminMember ||
      !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 멤버를 승인/거절할 수 있습니다',
      );
    }

    // 3. 상태가 Pending인지 확인
    if (serverMember.sStatus !== 'Pending') {
      throw new ConflictException(
        '대기 중인 멤버만 승인 또는 거절할 수 있습니다',
      );
    }

    // 4. 상태 업데이트 (Active 또는 Inactive만 허용)
    if (!['Active', 'Inactive'].includes(updateDto.sStatus)) {
      throw new ConflictException(
        '잘못된 상태입니다. 대기 멤버는 Active 또는 Inactive만 허용됩니다',
      );
    }

    // 5. 상태 업데이트
    await this._updateServerMemberStatus(
      serverMember.serverMemberPk,
      updateDto.sStatus,
    );

    // 업데이트된 멤버 정보를 다시 가져오기
    const updatedMember = await this.serverMemberRepository.findOne(
      { serverMemberPk, sStatus: MemberStatus.ACTIVE },
      ['user'],
    );

    if (!updatedMember) throw new NotFoundException(`유저 상태 변경에 실패했습니다.`);
    
    return {
      sStatus: updatedMember.sStatus,
      userInfo: {
        user_name: updatedMember.user.userName,
        user_email: updatedMember.user.userEmail,
        profile_image_path: updatedMember.user.profileImagePath,
      },
    };
  }

  async updateMemberStatusByEmail(
    serverPk: number,
    userEmail: string,
    sStatus: 'Active' | 'Inactive' | 'Banned',
    adminUserPk: number,
  ): Promise<PendingMemberDto> {
    // 1. userEmail로 사용자 찾기
    const user = await this.userRepository.findByEmail(userEmail);
    if (!user) throw new NotFoundException(`유저를 찾을 수 없습니다`);

    // 2. 서버 멤버 찾기
    const serverMember = await this.serverMemberRepository.findOne(
      { serverPk, userPk: user.userPk },
      ['user', 'server'],
    );

    if (!serverMember) {
      throw new NotFoundException(
        `사용자 ${userEmail}이 이 서버의 멤버가 아닙니다`,
      );
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne(
      {
        serverPk,
        userPk: adminUserPk,
        sStatus: 'Active',
      },
    );

    if (
      !adminMember ||
      !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 멤버를 승인/거절할 수 있습니다',
      );
    }

    // 4. 상태가 Pending인지 확인 (Banned는 예외)
    if (serverMember.sStatus !== 'Pending' && sStatus !== 'Banned') {
      throw new ConflictException(
        '대기 중인 멤버만 승인 또는 거절할 수 있습니다',
      );
    }

    // 5. 상태 업데이트
    await this._updateServerMemberStatus(serverMember.serverMemberPk, sStatus);

    // 6. Active로 승인된 경우, 기본 "일반" 프로젝트와 채널에 자동 가입
    if (sStatus === 'Active') {
      await this.addMemberToDefaultProjectAndChannel(serverPk, user.userPk);
    }

    // 업데이트된 멤버 정보를 다시 가져오기
    const updatedMember = await this.serverMemberRepository.findOne(
      { serverMemberPk: serverMember.serverMemberPk },
      ['user'],
    );

    if (!updatedMember) {
      throw new NotFoundException(
        `유저 ${serverMember.serverMemberPk}의 상태 변경에 실패했습니다.`,
      );
    }

    return {
      sStatus: updatedMember.sStatus,
      userInfo: {
        user_name: user.userName,
        user_email: user.userEmail,
        profile_image_path: user.profileImagePath,
      },
    };
  }

  // 밴당한 멤버 목록 조회 (관리자만)
  async getBannedMembers(
    serverPk: number,
    requestUserPk: number,
  ): Promise<PendingMemberDto[]> {


    // 1.5. 유효성이 확인된 서버 객체를 다시 로드
    const server = await this.serverRepository.findOne(
      { serverPk },
    );

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne(
      {
        serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    );

    if (
      !requestMember ||
      !ServerRoleUtils.hasAdminPermission(requestMember.serverRole)
    ) {
      throw new ForbiddenException(
        '서버 관리자 또는 소유자만 차단된 멤버를 볼 수 있습니다',
      );
    }

    // 3. 밴된 멤버 목록 조회
    const bannedMembers = await this.serverMemberRepository.findAll(
      { serverPk, sStatus: 'Banned' },
      ['user'],
      { serverMemberPk: 'DESC' }, // 최근 밴된 순서
    );

    return bannedMembers.map((member) => ({
      sStatus: member.sStatus,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // 밴당한 멤버 복구 (Owner만 가능)
  async unbanMember(
    serverMemberPk: number,
    adminUserPk: number,
  ): Promise<PendingMemberDto> {
    // 1. 밴된 멤버 확인
    const bannedMember = await this.serverMemberRepository.findOne(
      { serverMemberPk, sStatus: 'Banned' },
      ['user', 'server'],
    );

    if (!bannedMember) {
      throw new NotFoundException('차단된 멤버를 찾을 수 없습니다');
    }

    // 2. 관리자 권한 확인 (Owner만 언밴 가능)
    const adminMember = await this.serverMemberRepository.findOne(
      {
        serverPk: bannedMember.serverPk,
        userPk: adminUserPk,
        sStatus: 'Active',
      },
    );

    if (!adminMember || adminMember.serverRole !== 'owner') {
      throw new ForbiddenException(
        '서버 소유자만 멤버의 차단을 해제할 수 있습니다',
      );
    }

    // 3. 상태를 Active로 복구
    await this._updateServerMemberStatus(bannedMember.serverMemberPk, 'Active');

    // 업데이트된 멤버 정보를 다시 가져옵니다.
    const unbannedMember = await this.serverMemberRepository.findOne(
      { serverMemberPk: bannedMember.serverMemberPk },
      ['user'],
    );

    if (!unbannedMember) {
      throw new NotFoundException(
        `유저 ${bannedMember.serverMemberPk} 차단 해제 실패.`,
      );
    }

    return {
      sStatus: unbannedMember.sStatus,
      userInfo: {
        user_name: unbannedMember.user.userName,
        user_email: unbannedMember.user.userEmail,
        profile_image_path: unbannedMember.user.profileImagePath,
      },
    };
  }

  async banMember(
    serverPk: number,
    targetUserPk: number,
    adminUserPk: number,
  ): Promise<void> {


    // 1.5. 유효성이 확인된 서버 객체를 다시 로드
    const server = await this.serverRepository.findOne(
      { serverPk },
    );

    if (!server) {
      throw new NotFoundException(`서버를 찾을 수 없습니다 (내부 오류).`);
    }

    // 2. 차단할 멤버 확인 (승인된 멤버만)
    const targetMember = await this.serverMemberRepository.findOne(
      { serverPk, userPk: targetUserPk, sStatus: MemberStatus.ACTIVE },
    );

    if (!targetMember) {
      throw new NotFoundException(
        '대상 사용자가 이 서버의 멤버가 아닙니다',
      );
    }

    // 3. ban_members 권한 확인 (DB 권한 시스템 사용)
    const hasBanPermission =
      await this.serverRolePermissionService.hasPermission(
        serverPk,
        adminUserPk,
        'banMembers',
      );

    if (!hasBanPermission) {
      throw new ForbiddenException('멤버 차단 권한이 없습니다');
    }

    // 요청자 정보 조회 (Owner 여부 확인용)
    const adminMember = await this.serverMemberRepository.findOne(
      { serverPk, userPk: adminUserPk, sStatus: MemberStatus.ACTIVE },
    );

    if (!adminMember) {
      throw new ForbiddenException('서버 멤버가 아닙니다');
    }

    // 4. Owner는 차단할 수 없음
    if (targetMember.serverRole === 'owner') {
      throw new ForbiddenException('서버 소유자는 차단할 수 없습니다');
    }

    // 5. Admin끼리는 차단 불가 (Owner만 Admin 차단 가능)
    if (
      targetMember.serverRole === 'admin' &&
      adminMember.serverRole !== 'owner'
    ) {
      throw new ForbiddenException(
        '서버 소유자만 관리자 멤버를 차단할 수 있습니다',
      );
    }

    // 6. 논리적 삭제 (상태를 'Banned'로 변경)
    await this._updateServerMemberStatus(targetMember.serverMemberPk, 'Banned');
  }

  // 멤버 권한 일괄 변경 (manage_roles 권한 필요)
  async bulkUpdateMemberRoles(
    serverPk: number,
    changes: Array<{ userEmail: string; newRole: 'member' | 'admin' }>,
    ownerUserPk: number,
  ): Promise<BulkOperationResult> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne(
      { serverPk },
    );

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. manage_roles 권한 확인 (DB 권한 시스템 사용)
    const hasManageRolesPermission =
      await this.serverRolePermissionService.hasPermission(
        serverPk,
        ownerUserPk,
        'manageRoles',
      );

    if (!hasManageRolesPermission) {
      throw new ForbiddenException('역할 관리 권한이 없습니다');
    }

    const results: BulkOperationResult = {
      processed: 0,
      failed: [],
    };

    // 3. 각 멤버의 권한 변경 처리
    for (const change of changes) {
      try {
        // 사용자 찾기
        const user = await this.userRepository.findByEmail(change.userEmail);
        if (!user) throw new NotFoundException(`유저를 찾을 수 없습니다`);

        // 서버 멤버 찾기
        const serverMember = await this.serverMemberRepository.findOne(
          {
            serverPk,
            userPk: user.userPk,
            sStatus: 'Active',
          },
        );

        if (!serverMember) {
          results.failed.push({
            userEmail: change.userEmail,
            reason: '사용자가 이 서버의 멤버가 아닙니다',
          });
          continue;
        }

        // owner의 권한은 변경할 수 없음
        if (serverMember.serverRole === 'owner') {
          results.failed.push({
            userEmail: change.userEmail,
            reason: '소유자 권한은 변경할 수 없습니다',
          });
          continue;
        }

        // 권한 변경
        serverMember.serverRole = change.newRole;
        await this.serverMemberRepository.save(serverMember);
        results.processed++;
      } catch (error) {
        results.failed.push({
          userEmail: change.userEmail,
          reason: '권한 변경 실패',
        });
      }
    }
    return results;
  }

  // 멤버 일괄 강퇴/밴 (kick_members 또는 ban_members 권한 필요)
  async bulkMemberAction(
    serverPk: number,
    action: 'kick' | 'ban',
    userEmails: string[],
    adminUserPk: number,
  ): Promise<BulkOperationResult> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne(
      { serverPk, isDeletedServer: false },
    );

    if (!server) {
      throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
    }

    // 2. 요청자의 권한 확인 (DB 권한 시스템 사용)
    const requiredPermission = action === 'kick' ? 'kickMembers' : 'banMembers';
    const hasRequiredPermission =
      await this.serverRolePermissionService.hasPermission(
        serverPk,
        adminUserPk,
        requiredPermission,
      );

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `${action === 'kick' ? '강퇴' : '차단'} 권한이 없습니다`,
      );
    }

    // 요청자 정보 조회 (Owner 여부 확인용)
    const adminMember = await this.serverMemberRepository.findOne(
      {
        serverPk,
        userPk: adminUserPk,
        sStatus: 'Active',
      },
    );

    if (!adminMember) {
      throw new ForbiddenException('서버 멤버가 아닙니다');
    }

    const results: BulkOperationResult = {
      processed: 0,
      failed: [],
    };

    // 3. 각 멤버에 대해 강퇴/밴 처리
    for (const userEmail of userEmails) {
      try {
        // 사용자 찾기
        const user = await this.userRepository.findByEmail(userEmail);
        if (!user) throw new NotFoundException(`유저를 찾을 수 없습니다`);

        // 대상 멤버 찾기
        const targetMember = await this.serverMemberRepository.findOne(
          {
            serverPk,
            userPk: user.userPk,
            sStatus: 'Active',
          },
        );

        if (!targetMember) {
          results.failed.push({
            userEmail,
            reason: '사용자가 이 서버의 활성 멤버가 아닙니다',
          });
          continue;
        }

        // Owner는 강퇴/밴할 수 없음
        if (targetMember.serverRole === 'owner') {
          results.failed.push({
            userEmail,
            reason: '서버 소유자는 강퇴/차단할 수 없습니다',
          });
          continue;
        }

        // Admin끼리는 강퇴/밴 불가능 (Owner만 Admin을 강퇴/밴 가능)
        if (
          targetMember.serverRole === 'admin' &&
          adminMember.serverRole !== 'owner'
        ) {
          results.failed.push({
            userEmail,
            reason: '서버 소유자만 관리자 멤버를 강퇴/차단할 수 있습니다',
          });
          continue;
        }

        // 액션 수행
        if (action === 'kick') {
          await this._updateServerMemberStatusInManagement(
            targetMember.serverMemberPk,
            'Inactive',
          );
        } else if (action === 'ban') {
          await this._updateServerMemberStatusInManagement(
            targetMember.serverMemberPk,
            'Banned',
          );
        }
        results.processed++;
      } catch (error) {
        results.failed.push({
          userEmail,
          reason: '서버 오류가 발생했습니다',
        });
      }
    }

    return results;
  }

  private async _updateServerMemberStatusInManagement(
    serverMemberPk: number,
    newStatus: 'Active' | 'Inactive' | 'Banned',
  ): Promise<void> {
    const serverMember = await this.serverMemberRepository.findOne(
      { serverMemberPk },
    );

    if (!serverMember) {
      throw new NotFoundException(
        `서버 멤버 ${serverMemberPk} 를 찾을 수 없습니다.`,
      );
    }
    serverMember.sStatus = newStatus;

    await this.serverMemberRepository.save(serverMember);
  }

  private async _updateServerMemberStatus(
    serverMemberPk: number,
    newStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned',
  ): Promise<void> {
    const serverMember = await this.serverMemberRepository.findOne(
      { serverMemberPk },
    );

    if (!serverMember) {
      throw new NotFoundException(
        `서버멤버 ${serverMemberPk} 를 찾을 수 없습니다.`,
      );
    }

    serverMember.sStatus = newStatus;
    await this.serverMemberRepository.save(serverMember);
  }

  // 기본 프로젝트와 모든 public 채널에 멤버 자동 추가 (private helper)
  private async addMemberToDefaultProjectAndChannel(
    serverPk: number,
    userPk: number,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 기본 "일반" 프로젝트 찾기
      const defaultProject = await this.projectRepository.findOne({
        serverPk,
        projectName: '일반',
        isDeletedProject: false,
      });

      if (!defaultProject) {
        throw new NotFoundException(`서버에 기본 "일반" 프로젝트가 없습니다.`);
      }

      // 2. 프로젝트 멤버 추가
      await this.projectMemberRepository.addMember(
        queryRunner.manager,
        defaultProject.projectPk,
        userPk,
      );

      // 3. 일반 프로젝트의 모든 public 채널에 자동 추가
      await this.channelMemberRepository.addAllToPublicChannelsInProject(
        queryRunner.manager,
        defaultProject.projectPk,
        userPk,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        '기본 프로젝트 및 채널 가입 처리 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
