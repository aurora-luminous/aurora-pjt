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
