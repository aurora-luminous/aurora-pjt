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
import { Channel } from './channel.entity';

@Entity('channelmember')
@Unique(['channelPk', 'userPk']) // 복합 유니크 제약
export class ChannelMember {
  @ApiProperty({ description: '채널멤버 기본키' })
  @PrimaryGeneratedColumn()
  channelMemberPk: number;

  @ApiProperty({ description: '채널 기본키 (외래키)' })
  @Column()
  channelPk: number;

  @ApiProperty({ description: '사용자 기본키 (외래키)' })
  @Column()
  userPk: number;

  @ApiProperty({ description: '마지막 읽은 메시지 (외래키)', required: false })
  @Column({ type: 'bigint', nullable: true })
  lastReadMessage: number;

  @ApiProperty({ 
    description: '채널 역할', 
    enum: ['member', 'admin', 'owner'], 
    default: 'member' 
  })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'member' 
  })
  channelRole: 'member' | 'admin' | 'owner';

  @ApiProperty({ description: '음소거 여부', default: false })
  @Column({ type: 'boolean', default: false })
  isMute: boolean;

  // 관계 설정
  @ManyToOne(() => Channel, channel => channel.channelMembers)
  @JoinColumn({ name: 'channelPk' })
  channel: Channel;

  @ManyToOne(() => User, user => user.channelMembers)
  @JoinColumn({ name: 'userPk' })
  user: User;

}