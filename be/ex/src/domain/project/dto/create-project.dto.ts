import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '프로젝트명', maxLength: 50 })
  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  projectName: string;

  @ApiProperty({ description: '서버 PK' })
  @IsInt()
  @IsPositive()
  serverPk: number;

  @ApiProperty({ description: '프로젝트 설명', required: false })
  @IsString()
  @IsOptional()
  projectDescription?: string;

  @ApiProperty({ description: '프로젝트 생성자 사용자 PK' })
  @IsInt()
  @IsPositive()
  creatorUserPk: number;
}