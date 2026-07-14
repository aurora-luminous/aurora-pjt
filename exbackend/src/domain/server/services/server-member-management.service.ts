import { PendingMemberDto, UpdateMemberStatusDto, BulkOperationResult } from '../dto';

export abstract class ServerMemberManagementService {
  abstract getPendingMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]>;
  abstract updateMemberStatus(serverMemberPk: number, updateDto: UpdateMemberStatusDto): Promise<PendingMemberDto>;
  abstract updateMemberStatusByEmail(
    serverPk: number,
    userEmail: string,
    sStatus: 'Active' | 'Inactive' | 'Banned',
    adminUserPk: number,
  ): Promise<PendingMemberDto>;
  abstract getBannedMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]>;
  abstract unbanMember(serverMemberPk: number, adminUserPk: number): Promise<PendingMemberDto>;
  abstract banMember(serverPk: number, targetUserPk: number, adminUserPk: number): Promise<void>;
  abstract bulkUpdateMemberRoles(
    serverPk: number,
    changes: Array<{ userEmail: string; newRole: 'member' | 'admin' }>,
    ownerUserPk: number,
  ): Promise<BulkOperationResult>;
  abstract bulkMemberAction(
    serverPk: number,
    action: 'kick' | 'ban',
    userEmails: string[],
    adminUserPk: number,
  ): Promise<BulkOperationResult>;
}
