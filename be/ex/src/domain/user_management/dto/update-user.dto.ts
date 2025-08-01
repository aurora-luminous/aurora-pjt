import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['user_email', 'password'] as const)
) {
  // user_email과 password는 수정 불가 (보안상)
}