export interface BulkRoleUpdateDto {
  changes: Array<{
    userEmail: string;
    newRole: 'member' | 'admin';
  }>;
}

export interface BulkActionDto {
  action: 'kick' | 'ban';
  userEmails: string[];
}

export interface BulkOperationResult {
  processed: number;
  failed: Array<{
    userEmail: string;
    reason: string;
  }>;
}