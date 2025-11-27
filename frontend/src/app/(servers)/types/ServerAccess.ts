export interface ServerAccess {
  sStatus: string;
  userInfo: UserInfo;
}

export interface UserInfo {
  user_name: string;
  user_email: string;
  profile_image_path: string;
}

// ServerStatus를 단순한 문자열 유니온 타입으로 변경
export type ServerStatus = "Approved" | "Pending" | "Banned";
