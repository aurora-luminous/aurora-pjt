import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Server } from './server.entity';

@Entity('servermember')
@Unique(['userPk', 'serverPk'])
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

  @ApiProperty({ description: '서버 멤버 승인 상태' })
  @Column({ type: 'varchar', length: 20, name: 's_status' })
  sStatus: string;

  @ApiProperty({
    description: '멤버 온오프라인 상태',
    enum: ['Online', 'Offline', 'Away', 'Busy'],
    default: 'Offline',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: 'Offline',
  })
  status: 'Online' | 'Offline' | 'Away' | 'Busy';

  @ApiProperty({
    description: '서버 역할',
    enum: ['member', 'admin', 'owner'],
    default: 'member',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: 'member',
  })
  serverRole: 'member' | 'admin' | 'owner';

  //관계 설정
  @ManyToOne(() => User, (user) => user.serverMembers)
  @JoinColumn({ name: 'user_pk' })
  user: User;

  @ManyToOne(() => Server, (server) => server.serverMembers)
  @JoinColumn({ name: 'server_pk' })
  server: Server;
}
