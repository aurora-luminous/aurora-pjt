import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserOption } from './user-option.entity';
import { ServerMember } from '../../server/entities/server-member.entity';
import { ProjectMember } from '../../project/entities/project-member.entity';
import { ChannelMember } from '../../text-channel/entities/channel-member.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: '사용자 기본키' })
  @PrimaryGeneratedColumn()
  userPk: number;

  @ApiProperty({ description: '사용자 이메일', maxLength: 50 })
  @Column({ type: 'varchar', length: 50, unique: true })
  userEmail: string;

  @ApiProperty({ description: '사용자 이름', maxLength: 20, default: '익명' })
  @Column({ type: 'varchar', length: 20, default: '익명' })
  userName: string;

  @ApiProperty({ description: '비밀번호 (해시)', maxLength: 255 })
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({ description: '삭제 여부', default: false })
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @ApiProperty({ description: '프로필 이미지 경로', required: false })
  @Column({ type: 'text', nullable: true })
  profileImagePath: string;

  @ApiProperty({ description: '생성 시간' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '수정 시간' })
  @UpdateDateColumn()
  updatedAt: Date;

  // 관계 설정
  @OneToOne(() => UserOption, (option) => option.user, { cascade: true })
  option: UserOption;

  @OneToMany(() => ServerMember, (serverMember) => serverMember.user)
  serverMembers: ServerMember[];

  @OneToMany(() => ProjectMember, (projectMember) => projectMember.user)
  projectMembers: ProjectMember[];

  @OneToMany(() => ChannelMember, (channelMember) => channelMember.user)
  channelMembers: ChannelMember[];

}
