import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Channel } from './channel.entity';

@Entity('projectmember')
@Unique(['projectPk', 'userPk']) // 복합 유니크 제약
export class ProjectMember {
  @ApiProperty({ description: '프로젝트멤버 기본키' })
  @PrimaryGeneratedColumn()
  projectMemberPk: number;

  @ApiProperty({ description: '프로젝트 기본키 (외래키)' })
  @Column()
  projectPk: number;

  @ApiProperty({ description: '사용자 기본키 (외래키)' })
  @Column()
  userPk: number;

  @ApiProperty({ 
    description: '프로젝트 역할', 
    enum: ['member', 'admin', 'owner'], 
    default: 'member' 
  })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'member' 
  })
  projectRole: 'member' | 'admin' | 'owner';

  @ApiProperty({ description: '마지막 접속 채널 (외래키)', required: false })
  @Column({ nullable: true })
  lastConnectedChannel: number;

  @ApiProperty({ description: '마지막 접속 시간', required: false })
  @Column({ type: 'timestamp', nullable: true })
  lastConnectedTime: Date;

  // 관계 설정
  @ManyToOne(() => Project, project => project.projectMembers)
  @JoinColumn({ name: 'project_pk' })
  project: Project;

  @ManyToOne(() => User, user => user.projectMembers)
  @JoinColumn({ name: 'user_pk' })
  user: User;

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn({ name: 'last_connected_channel' })
  lastConnectedChannelRef: Channel;
}