import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({ description: '프로젝트 PK' })
  projectPk: number;

  @ApiProperty({ description: '프로젝트명' })
  projectName: string;

  @ApiProperty({ description: '서버 PK' })
  serverPk: number;

  @ApiProperty({ description: '프로젝트 설명', required: false })
  projectDescription?: string;

  @ApiProperty({ description: '프로젝트 삭제 여부' })
  isDeletedProject: boolean;

  @ApiProperty({ description: '서버 정보', required: false })
  serverInfo?: {
    serverPk: number;
    serverName: string;
  };

  @ApiProperty({ description: '소유자 정보', required: false })
  ownerInfo?: {
    userName: string;
  };
}

// 프로젝트 목록/생성 응답용
export class ProjectListDto {
  @ApiProperty({ description: '프로젝트 PK' })
  projectPk: number;

  @ApiProperty({ description: '프로젝트명' })
  projectName: string;
}