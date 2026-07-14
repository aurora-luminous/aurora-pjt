import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../server/entities/server.entity';
import { ProjectMember } from './project-member.entity';
import { Channel } from '../../channel/entities/channel.entity';
import { Event } from './event.entity';

@Entity('project')
export class Project {
  @ApiProperty({ description: '프로젝트 기본키' })
  @PrimaryGeneratedColumn()
  projectPk: number;

  @ApiProperty({ description: '서버 기본키 (외래키)' })
  @Column()
  serverPk: number;

  @ApiProperty({ description: '프로젝트명', maxLength: 20, default: '일반' })
  @Column({ type: 'varchar', length: 20, default: '일반' })
  projectName: string;

  @ApiProperty({ description: '프로젝트 삭제 여부', default: false })
  @Column({ type: 'boolean', default: false })
  isDeletedProject: boolean;

  @ApiProperty({ description: '기본 프로젝트 여부 (삭제 불가)', default: false })
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // 관계 설정
  @ManyToOne(() => Server, (server) => server.projects)
  @JoinColumn({ name: 'server_pk' })
  server: Server;

  @OneToMany(() => ProjectMember, (projectMember) => projectMember.project)
  projectMembers: ProjectMember[];

  @OneToMany(() => Channel, (channel) => channel.project)
  channels: Channel[];

  @OneToMany(() => Event, (event) => event.project)
  events: Event[];
}
