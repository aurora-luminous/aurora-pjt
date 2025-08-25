import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './project.entity';

@Entity('event')
export class Event {
  @ApiProperty({ description: '이벤트 기본키' })
  @PrimaryGeneratedColumn()
  eventPk: number;

  @ApiProperty({ description: '프로젝트 기본키 (외래키)' })
  @Column()
  projectPk: number;

  @ApiProperty({ description: '일정 날짜' })
  @Column({ type: 'timestamp' })
  date: Date;

  @ApiProperty({ description: '일정 내용' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '생성일시' })
  @CreateDateColumn()
  createdAt: Date;

  // 관계 설정
  @ManyToOne(() => Project, project => project.events)
  @JoinColumn({ name: 'project_pk' })
  project: Project;
}