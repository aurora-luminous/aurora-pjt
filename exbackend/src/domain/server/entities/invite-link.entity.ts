import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity('invite_link')
export class InviteLink {
  @PrimaryGeneratedColumn({ name: 'link_pk' })
  linkPk: number;

  @Column({ type: 'varchar', length: 12, unique: true })
  @Index({ unique: true })
  hash: string;

  @Column({ name: 'server_pk' })
  serverPk: number;

  @ManyToOne(() => Server, (server) => server.inviteLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_pk' })
  server: Server;

  @Column({ name: 'expired_time', type: 'timestamp', nullable: false }) // NOT NULL 추가
  expiredTime: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
