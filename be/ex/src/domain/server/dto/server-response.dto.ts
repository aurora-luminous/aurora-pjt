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
    userPk: number;
    userName: string;
    userEmail: string;
  };
}