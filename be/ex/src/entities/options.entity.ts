import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('options')
export class Option {
  @ApiProperty({ description: '옵션 기본키' })
  @PrimaryGeneratedColumn()
  optionPk: number;

  @ApiProperty({ description: '사용자 기본키 (외래키)' })
  @Column()
  userPk: number;

  @ApiProperty({ description: '입력 볼륨', default: 50 })
  @Column({ type: 'int', default: 50 })
  importVolume: number;

  @ApiProperty({ description: '출력 볼륨', default: 50 })
  @Column({ type: 'int', default: 50 })
  exportVolume: number;

  // 관계 설정
  @OneToOne(() => User, user => user.option)
  @JoinColumn({ name: 'userPk' })
  user: User;
}