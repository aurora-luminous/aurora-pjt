import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Server } from "../entities/server.entity";
import { ServerMember } from "../entities/server-member.entity";
import { User } from "../../user/entities/user.entity";
import { UserService } from "../../user/services/user.service";
import { ServerRolePermissionService } from "./server-role-permission.service";
import { BulkRoleUpdateDto, BulkActionDto, BulkOperationResult } from '../dto';

@Injectable()
export class ServerMemberManagementService {
    constructor(
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
        @InjectRepository(ServerMember)
        private readonly serverMemberRepository: Repository<ServerMember>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly serverRolePermissionService: ServerRolePermissionService,
    ) {}

    // 멤버 권한 일괄 변경 (manage_roles 권한 필요)
    async bulkUpdateMemberRoles(
        serverPk: number,
        changes: Array<{ userEmail: string; newRole: 'member' | 'admin' }>,
        ownerUserPk: number
    ): Promise<BulkOperationResult> {
        // 1. 서버 존재 확인
        const server = await this.serverRepository.findOne({
            where: { serverPk, isDeletedServer: false }
        });

        if (!server) {
            throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
        }

        // 2. manage_roles 권한 확인 (DB 권한 시스템 사용)
        const hasManageRolesPermission = await this.serverRolePermissionService.hasPermission(
            serverPk,
            ownerUserPk,
            'manageRoles'
        );

        if (!hasManageRolesPermission) {
            throw new ForbiddenException('역할 관리 권한이 없습니다');
        }

        const results: BulkOperationResult = {
            processed: 0,
            failed: []
        };

        // 3. 각 멤버의 권한 변경 처리
        for (const change of changes) {
            try {
                // 사용자 찾기
                const user = await this.userService.findByEmailOrThrow(change.userEmail);

                // 서버 멤버 찾기
                const serverMember = await this.serverMemberRepository.findOne({
                    where: {
                        serverPk,
                        userPk: user.userPk,
                        sStatus: 'Active'
                    }
                });

                if (!serverMember) {
                    results.failed.push({
                        userEmail: change.userEmail,
                        reason: '사용자가 이 서버의 활성 멤버가 아닙니다'
                    });
                    continue;
                }

                // owner의 권한은 변경할 수 없음
                if (serverMember.serverRole === 'owner') {
                    results.failed.push({
                        userEmail: change.userEmail,
                        reason: '소유자 권한은 변경할 수 없습니다'
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
                    reason: error.message || '알 수 없는 오류가 발생했습니다'
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
        adminUserPk: number
    ): Promise<BulkOperationResult> {
        // 1. 서버 존재 확인
        const server = await this.serverRepository.findOne({
            where: { serverPk, isDeletedServer: false }
        });

        if (!server) {
            throw new NotFoundException(`서버 ID ${serverPk}를 찾을 수 없습니다`);
        }

        // 2. 요청자의 권한 확인 (DB 권한 시스템 사용)
        const requiredPermission = action === 'kick' ? 'kickMembers' : 'banMembers';
        const hasRequiredPermission = await this.serverRolePermissionService.hasPermission(
            serverPk,
            adminUserPk,
            requiredPermission
        );

        if (!hasRequiredPermission) {
            throw new ForbiddenException(`${action === 'kick' ? '강퇴' : '차단'} 권한이 없습니다`);
        }

        // 요청자 정보 조회 (Owner 여부 확인용)
        const adminMember = await this.serverMemberRepository.findOne({
            where: {
                serverPk,
                userPk: adminUserPk,
                sStatus: 'Active'
            }
        });

        if (!adminMember) {
            throw new ForbiddenException('서버 멤버가 아닙니다');
        }

        const results: BulkOperationResult = {
            processed: 0,
            failed: []
        };

        // 3. 각 멤버에 대해 강퇴/밴 처리
        for (const userEmail of userEmails) {
            try {
                // 사용자 찾기
                const user = await this.userService.findByEmailOrThrow(userEmail);

                // 대상 멤버 찾기
                const targetMember = await this.serverMemberRepository.findOne({
                    where: {
                        serverPk,
                        userPk: user.userPk,
                        sStatus: 'Active'
                    }
                });

                if (!targetMember) {
                    results.failed.push({
                        userEmail,
                        reason: '사용자가 이 서버의 활성 멤버가 아닙니다'
                    });
                    continue;
                }

                // Owner는 강퇴/밴할 수 없음
                if (targetMember.serverRole === 'owner') {
                    results.failed.push({
                        userEmail,
                        reason: '서버 소유자는 강퇴/차단할 수 없습니다'
                    });
                    continue;
                }

                // Admin끼리는 강퇴/밴 불가능 (Owner만 Admin을 강퇴/밴 가능)
                if (targetMember.serverRole === 'admin' && adminMember.serverRole !== 'owner') {
                    results.failed.push({
                        userEmail,
                        reason: '서버 소유자만 관리자 멤버를 강퇴/차단할 수 있습니다'
                    });
                    continue;
                }

                // 액션 수행
                if (action === 'kick') {
                    // 강퇴: sStatus를 Inactive로 변경
                    targetMember.sStatus = 'Inactive';
                } else if (action === 'ban') {
                    // 밴: sStatus를 Banned로 변경
                    targetMember.sStatus = 'Banned';
                }

                await this.serverMemberRepository.save(targetMember);
                results.processed++;

            } catch (error) {
                results.failed.push({
                    userEmail,
                    reason: error.message || '알 수 없는 오류가 발생했습니다'
                });
            }
        }

        return results;
    }

}