import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ManageMemberDto {
  @ApiProperty({
    description: '대상 사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;
}

export class LastChannelDto {
  @ApiProperty({ description: '서버 Url' })
  serverUrl: string;

  @ApiProperty({ description: '프로젝트 Pk' })
  projectPk: number;

  @ApiProperty({ description: '채널 Pk' })
  channelPk: number;
}
