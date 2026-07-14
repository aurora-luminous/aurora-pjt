import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveFromProjectDto {
  @ApiProperty({ 
    description: '프로젝트 기본키',
    example: 1
  })
  @IsNumber()
  projectPk: number;

  @ApiProperty({ 
    description: '제거할 사용자 기본키',
    example: 2
  })
  @IsNumber()
  targetUserPk: number;

  @ApiProperty({ 
    description: '관리자 사용자 기본키',
    example: 1
  })
  @IsNumber()
  adminUserPk: number;
}