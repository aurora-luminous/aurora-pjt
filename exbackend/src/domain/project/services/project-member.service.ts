import {  InviteToProjectDto, ProjectMemberDto, ManageMemberDto, LastChannelDto, BulkInviteToProjectDto } from '../dto';

export abstract class ProjectMemberService {

  // 프로젝트에 멤버 초대
  abstract inviteMember(inviteToProjectDto: InviteToProjectDto): Promise<void>;

  // 여러명 초대
  abstract inviteMembers(dto: BulkInviteToProjectDto): Promise<{ message: string }>;

  // 프로젝트에서 멤버 강퇴
  abstract removeMember(projectPk: number, targetUserEmail: string, userPk: number): Promise<void>;

  // 프로젝트 멤버 역할 변경
  abstract updateMemberRole(projectPk: number, manageMemberDto: ManageMemberDto): Promise<void>;

  // 유저의 마지막 접속한 채널 업데이트
  abstract updateLastConnectedChannel(userPk: number, channelPk: number): Promise<void>;

  // 프로젝트 내 전체 멤버 조회
  abstract getProjectMembers(projectPk: number, userPk: number): Promise<ProjectMemberDto[]>;

  // 특정 멤버의 상세 정보 및 권한 조회
  abstract getMemberDetail(projectPk: number, userPk: number): Promise<ProjectMemberDto>;

  // 멤버의 마지막 채널 정보 조회
  abstract getLastConnectedChannelInfo(userPk: number): Promise<LastChannelDto>;

  // 멤버 차단 or 해제
  abstract banMemberFromProject(projectPk: number ,userEmail: string, adminUserPk: number): Promise<{ message: string }>;
  abstract unbanMemberFromProject(projectPk: number, userEmail: string, ownerUserPk: number): Promise<{ message: string }>;

  // 프로젝트 나가기
  abstract leaveProject(projectPk: number, userPk: number): Promise<{ message: string }>;
}