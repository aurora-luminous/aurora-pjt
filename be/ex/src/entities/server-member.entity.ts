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
import { Server } from './server.entity';

@Entity('servermember')
@Unique(['userPk', 'serverPk']) // 복합 유니크 제약
export class ServerMember {
  @ApiProperty({ description: '서버멤버 기본키' })
  @PrimaryGeneratedColumn()
  serverMemberPk: number;

  @ApiProperty({ description: '사용자 기본키 (외래키)' })
  @Column()
  userPk: number;

  @ApiProperty({ description: '서버 기본키 (외래키)' })
  @Column()
  serverPk: number;

  @ApiProperty({ 
    description: '멤버 상태', 
    enum: ['Pending', 'Approved', 'Rejected', 'Banned'], 
    default: 'Pending' 
  })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'Pending' 
  })
  status: 'Pending' | 'Approved' | 'Rejected' | 'Banned';

  @ApiProperty({ 
    description: '서버 역할', 
    enum: ['member', 'admin', 'owner'], 
    default: 'member' 
  })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'member' 
  })
  serverRole: 'member' | 'admin' | 'owner';

  // 관계 설정
  @ManyToOne(() => User, user => user.serverMembers)
  @JoinColumn({ name: 'userPk' })
  user: User;

  @ManyToOne(() => Server, server => server.serverMembers)
  @JoinColumn({ name: 'serverPk' })
  server: Server;
}