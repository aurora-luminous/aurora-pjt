export interface PendingMemberDto {
  sStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned';
  userInfo: {
    user_name: string;
    user_email: string;
    profile_image_path: string;
  };
  serverInfo?: {
    serverUrl: string;
    serverName: string;
  };
  defaultProject?: {
    projectPk: number;
    projectName: string;
  };
  defaultChannel?: {
    channelPk: number;
    channelName: string;
  };
}

export interface ServerMemberInfoDto {
  userInfo: {
    userName: string;
    userEmail: string;
    profileImagePath: string;
  };
}

export interface ServerMemberDetailDto extends ServerMemberInfoDto {
  sStatus: 'Pending' | 'Active' | 'Inactive' | 'Banned';
  serverRole: 'member' | 'admin' | 'owner' | 'projectManager';
}

export interface UpdateMemberStatusDto {
  sStatus: 'Active' | 'Inactive' | 'Banned';
  adminUserPk: number;
}