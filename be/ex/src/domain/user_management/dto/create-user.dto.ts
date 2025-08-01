import { IsEmail, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ description: '사용자 이메일', maxLength: 50 })
    @IsEmail()
    @Length(1, 50)
    user_email: string;

    @ApiProperty({ description: '사용자 이름', minLength: 1, maxLength: 10 })
    @IsString()
    @Length(1, 10)
    user_name: string;

    @ApiProperty({ description: '비밀번호', minLength: 1, maxLength: 20 })
    @IsString()
    @Length(1, 20)
    password: string;

    @ApiProperty({ description: '프로필 이미지 경로', required: false })
    @IsString()
    @IsOptional()
    profile_image_path?: string;
}