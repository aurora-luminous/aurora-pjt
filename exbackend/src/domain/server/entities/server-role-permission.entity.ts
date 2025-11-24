import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from './server.entity';

@Entity('server_role_permission')
@Unique(['serverPk', 'serverRole'])
export class ServerRolePermission {
  @ApiProperty({ description: '권한 기본키' })
  @PrimaryGeneratedColumn()
  permissionPk: number;

  @ApiProperty({ description: '서버 기본키 (외래키)' })
  @Column({ name: 'server_pk' })
  serverPk: number;

  @ApiProperty({
    description: '서버 역할',
    enum: ['owner', 'admin', 'projectManager', 'member']
  })
  @Column({ type: 'varchar', length: 20 })
  serverRole: 'owner' | 'admin' | 'projectManager' | 'member';

  @ApiProperty({ description: '멤버 킥 권한', default: false })
  @Column({ type: 'boolean', default: false })
  kickMembers: boolean;

  @ApiProperty({ description: '멤버 밴 권한', default: false })
  @Column({ type: 'boolean', default: false })
  banMembers: boolean;

  @ApiProperty({ description: '역할 관리 권한', default: false })
  @Column({ type: 'boolean', default: false })
  manageRoles: boolean;

  // 관계 설정
  @ManyToOne(() => Server, (server) => server.rolePermissions)
  @JoinColumn({ name: 'server_pk' })
  server: Server;
}