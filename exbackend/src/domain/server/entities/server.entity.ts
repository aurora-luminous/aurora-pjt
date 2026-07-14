import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ServerMember } from './server-member.entity';
import { Project } from '../../project/entities/project.entity';
import { ServerRolePermission } from './server-role-permission.entity';

@Entity('server')
export class Server {
  @ApiProperty({ description: '서버 기본키' })
  @PrimaryGeneratedColumn()
  serverPk: number;

  @ApiProperty({ description: '서버명', maxLength: 50 })
  @Column({ type: 'varchar', length: 50 })
  serverName: string;

  @ApiProperty({ description: '서버 URL', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  serverUrl: string;

  @ApiProperty({ description: '서버 삭제 여부', default: false })
  @Column({ type: 'boolean', default: false })
  isDeletedServer: boolean;

  //관계 설정
  @OneToMany(() => ServerMember, (serverMember) => serverMember.server)
  serverMembers: ServerMember[];

  @OneToMany(() => Project, (project) => project.server)
  projects: Project[];

  @OneToMany(() => ServerRolePermission, (permission) => permission.server)
  rolePermissions: ServerRolePermission[];

}
