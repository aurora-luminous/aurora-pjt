import { ApiProperty } from '@nestjs/swagger';

export class ServerResponseDto {
  @ApiProperty({ description: '서버 PK' })
  serverPk: number;

  @ApiProperty({ description: '서버명' })
  serverName: string;

  @ApiProperty({ description: '서버 URL' })
  serverUrl: string;

  @ApiProperty({ description: '서버 삭제 여부' })
  isDeletedServer: boolean;

  @ApiProperty({ description: '서버 소유자 정보', required: false })
  ownerInfo?: {
    userName: string;
    userEmail: string;
  };
}

// 서버 목록 조회용
export class ServerListDto {
  @ApiProperty({ description: '서버 URL' })
  serverUrl: string;

  @ApiProperty({ description: '서버명' })
  serverName: string;
}

// 서버 생성 응답 DTO
export class ServerCreateResponseDto {
  @ApiProperty({ description: '메시지' })
  message: string;
}

// 서버 초대 링크 응답 DTO
export class ServerInviteLinkResponseDto {
  @ApiProperty({ description: '초대 링크' })
  inviteLink: string;
}