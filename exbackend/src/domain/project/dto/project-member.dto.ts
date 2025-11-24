import { ApiProperty } from '@nestjs/swagger';

export class ProjectMemberUserInfoDto {
  @ApiProperty({ description: '사용자명' })
  userName: string;

  @ApiProperty({ description: '사용자 이메일' })
  userEmail: string;

  @ApiProperty({ description: '프로필 이미지 경로' })
  profileImagePath: string;
}

export class ProjectMemberDto {
  @ApiProperty({
    description: '프로젝트 기본키',
    example: 1
  })
  projectPk: number;

  @ApiProperty({ 
    description: '프로젝트 상태',
    enum: ['Active', 'Inactive', 'Banned']
  })
  pStatus: 'Active' | 'Inactive' | 'Banned';

  @ApiProperty({
    description: '프로젝트 역할',
    enum: ['member', 'admin']
  })
  projectRole: 'member' | 'admin';

  @ApiProperty({ 
    description: '사용자 정보',
    type: ProjectMemberUserInfoDto
  })
  userInfo: ProjectMemberUserInfoDto;
}

export interface ProjectMemberNotificationDto {
  eventType: 'MEMBER_ADDED' | 'MEMBER_REMOVED';
  projectPk: number;
  userPk: number;
  userName: string;
  projectRole: string;
  timestamp: number;
}