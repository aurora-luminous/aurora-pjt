import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsNotEmpty, Length, IsUrl } from 'class-validator';

export class CreateServerDto {
  @ApiProperty({ description: '서버명', maxLength: 50 })
  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  serverName: string;

  @ApiProperty({ description: '서버 URL', maxLength: 100, example: 'example' })
  @IsString()
  @IsUrl()
  @Length(1, 100)
  @IsNotEmpty()
  serverUrl: string;

  @ApiProperty({ description: '서버 생성자 사용자 PK' })
  @IsInt()
  @IsPositive()
  creatorUserPk: number;
}