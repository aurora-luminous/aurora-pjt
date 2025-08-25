export interface ServerAccess {
  status: string;
  userInfo: UserInfo;
}

export interface UserInfo {
  user_name: string;
  user_email: string;
  profile_image_path: string;
}


export interface ServerStatus {
    status : "Approved" | "Pending" | "Banned";
}