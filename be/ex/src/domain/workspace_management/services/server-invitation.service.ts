import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Server } from '../../../entities/server.entity';
import { ServerMember } from '../../../entities/server-member.entity';
import { User } from '../../../entities/user.entity';

export interface JoinServerDto {
  inviteHash: string;
  userPk: number;
}

export interface ServerInviteDto {
  serverPk: number;
  inviteHash: string;
  inviteLink: string;
}

export interface PendingMemberDto {
  serverMemberPk: number;
  userPk: number;
  status: string;
  userInfo: {
    user_pk: number;
    user_name: string;
    user_email: string;
    profile_image_path: string;
  };
}

export interface UpdateMemberStatusDto {
  status: 'Approved' | 'Rejected' | 'Banned';
  adminUserPk: number;
}

@Injectable()
export class ServerInvitationService {
  private readonly INVITE_SALT = 'server_invite_salt_2024'; // 환경변수로 관리 권장

  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  // serverPk를 해시로 변환
  private generateInviteHash(serverPk: number): string {
    return crypto
      .createHash('sha256')
      .update(`${serverPk}-${this.INVITE_SALT}`)
      .digest('hex')
      .substring(0, 16); // 16자리 해시
  }

  // 해시를 serverPk로 역변환 (모든 서버를 순회해서 매칭)
  private async getServerPkFromHash(inviteHash: string): Promise<number | null> {
    const servers = await this.serverRepository.find({
      where: { isDeletedServer: false },
      select: ['serverPk']
    });

    for (const server of servers) {
      if (this.generateInviteHash(server.serverPk) === inviteHash) {
        return server.serverPk;
      }
    }
    return null;
  }

  // 서버 초대 링크 생성
  async generateInviteLink(serverPk: number, requestUserPk: number): Promise<ServerInviteDto> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverPk} not found`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk, 
        userPk: requestUserPk, 
        status: 'Approved'
      }
    });

    if (!serverMember || !['admin', 'owner'].includes(serverMember.serverRole)) {
      throw new ForbiddenException('Only server admin or owner can generate invite links');
    }

    // 3. 해시 생성 및 링크 생성
    const inviteHash = this.generateInviteHash(serverPk);
    const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const inviteLink = `${baseUrl}/join/${inviteHash}`;

    return {
      serverPk,
      inviteHash,
      inviteLink,
    };
  }

  // 초대 링크로 서버 가입 신청
  async joinServerByInvite(joinDto: JoinServerDto): Promise<PendingMemberDto> {
    // 1. 해시로 서버 찾기
    const serverPk = await this.getServerPkFromHash(joinDto.inviteHash);
    
    if (!serverPk) {
      throw new NotFoundException('Invalid invite link');
    }

    // 2. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException('Server not found or deleted');
    }

    // 3. 사용자 존재 확인
    const user = await this.userRepository.findOne({
      where: { userPk: joinDto.userPk, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${joinDto.userPk} not found`);
    }

    // 4. 이미 서버 멤버인지 확인
    const existingMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: joinDto.userPk }
    });

    if (existingMember) {
      if (existingMember.status === 'Approved') {
        throw new ConflictException('User is already a member of this server');
      } else if (existingMember.status === 'Pending') {
        throw new ConflictException('Join request is already pending');
              } else if (existingMember.status === 'Rejected' || existingMember.status === 'Banned') {
        // 거절되었거나 밴당한 사용자의 재신청 가능하도록 상태 업데이트
        existingMember.status = 'Pending';
        await this.serverMemberRepository.save(existingMember);
        
        return {
          serverMemberPk: existingMember.serverMemberPk,
          userPk: existingMember.userPk,
          status: existingMember.status,
          userInfo: {
            user_pk: user.userPk,
            user_name: user.userName,
            user_email: user.userEmail,
            profile_image_path: user.profileImagePath,
          },
        };
      }
    }

    // 5. 가입 신청 생성 (Pending 상태)
    const serverMember = this.serverMemberRepository.create({
      serverPk,
      userPk: joinDto.userPk,
      status: 'Pending',
      serverRole: 'member',
    });
    const savedMember = await this.serverMemberRepository.save(serverMember);

    return {
      serverMemberPk: savedMember.serverMemberPk,
      userPk: savedMember.userPk,
      status: savedMember.status,
      userInfo: {
        user_pk: user.userPk,
        user_name: user.userName,
        user_email: user.userEmail,
        profile_image_path: user.profileImagePath,
      },
    };
  }

  // 서버 승인 대기 목록 조회
  async getPendingMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverPk} not found`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk, 
        userPk: requestUserPk, 
        status: 'Approved'
      }
    });

    if (!requestMember || !['admin', 'owner'].includes(requestMember.serverRole)) {
      throw new ForbiddenException('Only server admin or owner can view pending members');
    }

    // 3. 대기 중인 멤버 목록 조회
    const pendingMembers = await this.serverMemberRepository.find({
      where: { serverPk, status: 'Pending' },
      relations: ['user'],
      order: { serverMemberPk: 'ASC' }, // 신청 순서대로
    });

    return pendingMembers.map(member => ({
      serverMemberPk: member.serverMemberPk,
      userPk: member.userPk,
      status: member.status,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // 서버 가입 승인/거절
  async updateMemberStatus(
    serverMemberPk: number, 
    updateDto: UpdateMemberStatusDto
  ): Promise<PendingMemberDto> {
    // 1. 서버 멤버 존재 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk },
      relations: ['user', 'server']
    });

    if (!serverMember) {
      throw new NotFoundException(`Server member with ID ${serverMemberPk} not found`);
    }

    // 2. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk: serverMember.serverPk, 
        userPk: updateDto.adminUserPk, 
        status: 'Approved'
      }
    });

    if (!adminMember || !['admin', 'owner'].includes(adminMember.serverRole)) {
      throw new ForbiddenException('Only server admin or owner can approve/reject members');
    }

    // 3. 상태가 Pending인지 확인
    if (serverMember.status !== 'Pending') {
      throw new ConflictException('Only pending members can be approved or rejected');
    }

    // 4. 상태 업데이트 (Approved 또는 Rejected만 허용)
    if (!['Approved', 'Rejected'].includes(updateDto.status)) {
      throw new ConflictException('Invalid status. Only Approved or Rejected allowed for pending members');
    }

    // 5. 상태 업데이트 (Approved 또는 Rejected만 허용)
    if (!['Approved', 'Rejected'].includes(updateDto.status)) {
      throw new ConflictException('Invalid status. Only Approved or Rejected allowed for pending members');
    }

    // 4. 상태 업데이트
    serverMember.status = updateDto.status;
    const updatedMember = await this.serverMemberRepository.save(serverMember);

    return {
      serverMemberPk: updatedMember.serverMemberPk,
      userPk: updatedMember.userPk,
      status: updatedMember.status,
      userInfo: {
        user_pk: serverMember.user.userPk,
        user_name: serverMember.user.userName,
        user_email: serverMember.user.userEmail,
        profile_image_path: serverMember.user.profileImagePath,
      },
    };
  }

  // 서버의 활성 멤버 목록 조회 (Approved 상태만)
  async getActiveServerMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverPk} not found`);
    }

    // 2. 요청자가 서버 멤버인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk, 
        userPk: requestUserPk, 
        status: 'Approved'
      }
    });

    if (!requestMember) {
      throw new ForbiddenException('Only server members can view member list');
    }

    // 3. 활성 멤버 목록 조회 (Approved 상태만)
    const activeMembers = await this.serverMemberRepository.find({
      where: { serverPk, status: 'Approved' },
      relations: ['user'],
      order: { serverMemberPk: 'ASC' },
    });

    return activeMembers.map(member => ({
      serverMemberPk: member.serverMemberPk,
      userPk: member.userPk,
      status: member.status,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }

  // 밴당한 멤버 목록 조회 (관리자만)
  async getBannedMembers(serverPk: number, requestUserPk: number): Promise<PendingMemberDto[]> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverPk} not found`);
    }

    // 2. 요청자가 서버 관리자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk, 
        userPk: requestUserPk, 
        status: 'Approved'
      }
    });

    if (!requestMember || !['admin', 'owner'].includes(requestMember.serverRole)) {
      throw new ForbiddenException('Only server admin or owner can view banned members');
    }

    // 3. 밴된 멤버 목록 조회
    const bannedMembers = await this.serverMemberRepository.find({
      where: { serverPk, status: 'Banned' },
      relations: ['user'],
      order: { serverMemberPk: 'DESC' }, // 최근 밴된 순서
    });

    return bannedMembers.map(member => ({
      serverMemberPk: member.serverMemberPk,
      userPk: member.userPk,
      status: member.status,
      userInfo: {
        user_pk: member.user.userPk,
        user_name: member.user.userName,
        user_email: member.user.userEmail,
        profile_image_path: member.user.profileImagePath,
      },
    }));
  }
  
  // 밴당한 멤버 복구 (Owner만 가능)
  async unbanMember(serverMemberPk: number, adminUserPk: number): Promise<PendingMemberDto> {
    // 1. 밴된 멤버 확인
    const bannedMember = await this.serverMemberRepository.findOne({
      where: { serverMemberPk, status: 'Banned' },
      relations: ['user', 'server']
    });

    if (!bannedMember) {
      throw new NotFoundException('Banned member not found');
    }

    // 2. 관리자 권한 확인 (Owner만 언밴 가능)
    const adminMember = await this.serverMemberRepository.findOne({
      where: { 
        serverPk: bannedMember.serverPk, 
        userPk: adminUserPk, 
        status: 'Approved'
      }
    });

    if (!adminMember || adminMember.serverRole !== 'owner') {
      throw new ForbiddenException('Only server owner can unban members');
    }

    // 3. 상태를 Approved로 복구
    bannedMember.status = 'Approved';
    const unbannedMember = await this.serverMemberRepository.save(bannedMember);

    return {
      serverMemberPk: unbannedMember.serverMemberPk,
      userPk: unbannedMember.userPk,
      status: unbannedMember.status,
      userInfo: {
        user_pk: bannedMember.user.userPk,
        user_name: bannedMember.user.userName,
        user_email: bannedMember.user.userEmail,
        profile_image_path: bannedMember.user.profileImagePath,
      },
    };
  }
  async banMember(serverPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverPk, isDeletedServer: false }
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverPk} not found`);
    }

    // 2. 강퇴할 멤버 확인 (승인된 멤버만)
    const targetMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: targetUserPk, status: 'Approved' }
    });

    if (!targetMember) {
      throw new NotFoundException('Target user is not an active member of this server');
    }

    // 3. 관리자 권한 확인
    const adminMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk: adminUserPk, status: 'Approved' }
    });

    if (!adminMember || !['admin', 'owner'].includes(adminMember.serverRole)) {
      throw new ForbiddenException('Only server admin or owner can kick members');
    }

    // 4. Owner는 강퇴할 수 없음
    if (targetMember.serverRole === 'owner') {
      throw new ForbiddenException('Cannot ban server owner');
    }

    // 5. Admin끼리는 강퇴 불가 (Owner만 Admin 강퇴 가능)
    if (targetMember.serverRole === 'admin' && adminMember.serverRole !== 'owner') {
      throw new ForbiddenException('Only server owner can ban admin members');
    }

    // 6. 논리적 삭제 (상태를 'Banned'로 변경)
    targetMember.status = 'Banned';
    await this.serverMemberRepository.save(targetMember);
  }
}