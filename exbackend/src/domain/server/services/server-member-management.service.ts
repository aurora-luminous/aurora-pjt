import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Server } from "../entities/server.entity";
import { ServerMember } from "../entities/server-member.entity";
import { User } from "../../user/entities/user.entity";
import { UserService } from "../../user/services/user.service";
import { ServerRoleUtils } from "../../../common/enums/member-role.enum";
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
    ) {}

    // 멤버 권한 일괄 변경 (owner 전용)
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
            throw new NotFoundException(`Server with ID ${serverPk} not found`);
        }

        // 2. owner인지 확인
        const ownerMember = await this.serverMemberRepository.findOne({
            where: {
                serverPk,
                userPk: ownerUserPk,
                sStatus: 'Active',
                serverRole: 'owner'
            }
        });

        if (!ownerMember) {
            throw new ForbiddenException('Only server owner can change member roles');
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
                        reason: 'User is not an active member of this server'
                    });
                    continue;
                }

                // owner의 권한은 변경할 수 없음
                if (serverMember.serverRole === 'owner') {
                    results.failed.push({
                        userEmail: change.userEmail,
                        reason: 'Cannot change owner role'
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
                    reason: error.message || 'Unknown error occurred'
                });
            }
        }
        return results;
    }

    // 멤버 일괄 강퇴/밴 (Admin 이상 가능)
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
            throw new NotFoundException(`Server with ID ${serverPk} not found`);
        }

        // 2. 요청자가 Admin 이상인지 확인
        const adminMember = await this.serverMemberRepository.findOne({
            where: {
                serverPk,
                userPk: adminUserPk,
                sStatus: 'Active'
            }
        });

        if (!adminMember || !ServerRoleUtils.hasAdminPermission(adminMember.serverRole)) {
            throw new ForbiddenException('Only server admin or owner can kick/ban members');
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
                        reason: 'User is not an active member of this server'
                    });
                    continue;
                }

                // Owner는 강퇴/밴할 수 없음
                if (targetMember.serverRole === 'owner') {
                    results.failed.push({
                        userEmail,
                        reason: 'Cannot kick/ban server owner'
                    });
                    continue;
                }

                // Admin끼리는 강퇴/밴 불가능 (Owner만 Admin을 강퇴/밴 가능)
                if (targetMember.serverRole === 'admin' && adminMember.serverRole !== 'owner') {
                    results.failed.push({
                        userEmail,
                        reason: 'Only server owner can kick/ban admin members'
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
                    reason: error.message || 'Unknown error occurred'
                });
            }
        }

        return results;
    }
}