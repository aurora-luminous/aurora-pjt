import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';
import { ChannelRoleType } from 'src/common/enums/member-role.enum';

export class UpdateChannelMemberRoleDto {
  @ApiProperty({ description: '역할을 변경할 대상 유저의 PK', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  targetUserPk: number;

  @ApiProperty({ description: '새로운 채널 역할', enum: ['admin', 'member'], example: 'admin' })
  @IsIn(['admin', 'member'])
  @IsNotEmpty()
  newRole: ChannelRoleType;
}
