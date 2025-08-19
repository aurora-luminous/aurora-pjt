import { IsEmail, IsNumber, IsOptional, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InviteToProjectDto {
  @ApiProperty({ 
    description: '프로젝트 기본키',
    example: 1
  })
  @IsNumber()
  projectPk: number;

  @ApiProperty({ 
    description: '초대할 사용자 이메일',
    example: 'user@example.com'
  })
  @IsEmail()
  userEmail: string;

  @ApiProperty({ 
    description: '초대자 사용자 기본키',
    example: 1
  })
  @IsNumber()
  inviterUserPk: number;

  @ApiProperty({ 
    description: '부여할 프로젝트 역할',
    enum: ['member', 'admin'],
    default: 'member',
    required: false
  })
  @IsOptional()
  @IsIn(['member', 'admin'])
  projectRole?: 'member' | 'admin';
}

// requests.txt에 맞는 사용자 이메일 DTO
export class UserEmailDto {
  @ApiProperty({ 
    description: '사용자 이메일',
    example: 'user@example.com'
  })
  @IsEmail()
  userEmail: string;
}

// 배열로 받는 프로젝트 초대 DTO
export class BulkInviteToProjectDto {
  @ApiProperty({ 
    description: '초대할 사용자들',
    type: [UserEmailDto],
    example: [{ userEmail: 'user1@example.com' }, { userEmail: 'user2@example.com' }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserEmailDto)
  users: UserEmailDto[];

  @ApiProperty({ 
    description: '프로젝트 기본키',
    example: 1
  })
  @IsNumber()
  projectPk: number;

  @ApiProperty({ 
    description: '초대자 사용자 기본키',
    example: 1
  })
  @IsNumber()
  inviterUserPk: number;
}