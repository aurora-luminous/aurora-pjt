import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';
import { ChannelMember } from './channel-member.entity';

@Entity('channel')
export class Channel {
  @ApiProperty({ description: '채널 기본키' })
  @PrimaryGeneratedColumn()
  channelPk: number;

  @ApiProperty({ description: '프로젝트 기본키 (외래키)' })
  @Column()
  projectPk: number;

  @ApiProperty({ description: '채널명', maxLength: 20, default: '일반' })
  @Column({ type: 'varchar', length: 20, default: '일반' })
  channelName: string;

  @ApiProperty({
    description: '채널 종류',
    maxLength: 20,
    enum: ['TEXT', 'VOICE', 'VIDEO'],
  })
  @Column({ type: 'varchar', length: 20 })
  channelKind: 'TEXT' | 'VOICE' | 'VIDEO';

  @ApiProperty({ description: '채널 삭제 여부', default: false })
  @Column({ type: 'boolean', default: false })
  isDeletedChannel: boolean;

  @ApiProperty({ description: '비공개 채널 여부', default: false })
  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  // 관계 설정
  @ManyToOne(() => Project, (project) => project.channels)
  @JoinColumn({ name: 'project_pk' })
  project: Project;

  @OneToMany(() => ChannelMember, (channelMember) => channelMember.channel)
  channelMembers: ChannelMember[];
}
