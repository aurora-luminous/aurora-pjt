import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserEmailDto {
  @ApiProperty({ description: '사용자 이메일' })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;
}
