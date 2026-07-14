import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ description: '새로운 프로젝트명', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  @IsNotEmpty()
  projectName: string;
}
