interface RolePermisson {
  permissonPk: number;
  serverPk: number;
  serverRole: string;
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}

export interface RolePermissions {
  rolePermissions: RolePermisson[];
}

interface Permission {
  kickMembers: boolean;
  banMembers: boolean;
  manageRoles: boolean;
}

export interface ChangePermission {
  serverRole: string;
  permissions: Permission;
}
