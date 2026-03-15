import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

export class ManageMemberDto {
  @ApiProperty({ description: '사용자 이메일' })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ description: '역할', enum: ['admin', 'member'] })
  @IsEnum(['admin', 'member'])
  role: string;
}
