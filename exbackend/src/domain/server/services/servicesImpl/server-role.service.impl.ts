import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerRolePermission } from '../../entities/server-role-permission.entity';
import { Server } from '../../entities/server.entity';
import { ServerMember } from '../../entities/server-member.entity';
import {
  UpdateRolePermissionDto,
  ServerRolePermissionResponseDto,
  GetServerPermissionsResponseDto,
} from '../../dto/server-role-permission.dto';

@Injectable()
export class ServerRolePermissionService {
  constructor(
    @InjectRepository(ServerRolePermission)
    private readonly permissionRepository: Repository<ServerRolePermission>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
  ) {}

  // 서버 권한 조회
  async getServerPermissions(
    serverUrl: string,
    requestUserPk: number,
  ): Promise<GetServerPermissionsResponseDto> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverUrl: serverUrl, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 멤버인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

    if (!requestMember) {
      throw new ForbiddenException('서버 멤버만 권한을 조회할 수 있습니다');
    }

    // 3. 권한 목록 조회
    const permissions = await this.permissionRepository.find({
      where: { serverPk: server.serverPk },
    });

    return {
      rolePermissions: permissions.map((permission) => ({
        permissionPk: permission.permissionPk,
        serverPk: permission.serverPk,
        serverRole: permission.serverRole,
        kickMembers: permission.kickMembers,
        banMembers: permission.banMembers,
        manageRoles: permission.manageRoles,
      })),
    };
  }

  // 서버 역할 권한 업데이트 (서버 소유자만 가능)
  async updateRolePermission(
    serverUrl: string,
    updateDto: Omit<UpdateRolePermissionDto, 'serverPk'>,
    requestUserPk: number,
  ): Promise<ServerRolePermissionResponseDto> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({
      where: { serverUrl: serverUrl, isDeletedServer: false },
    });

    if (!server) {
      throw new NotFoundException(`서버 URL ${serverUrl}를 찾을 수 없습니다`);
    }

    // 2. 요청자가 서버 소유자인지 확인
    const requestMember = await this.serverMemberRepository.findOne({
      where: {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: 'Active',
      },
    });

    if (!requestMember || requestMember.serverRole !== 'owner') {
      throw new ForbiddenException('서버 소유자만 권한을 설정할 수 있습니다');
    }

    // 3. 기존 권한 설정 찾기 또는 생성
    let permission = await this.permissionRepository.findOne({
      where: { serverPk: server.serverPk, serverRole: updateDto.serverRole },
    });

    if (!permission) {
      permission = this.permissionRepository.create({
        serverPk: server.serverPk,
        serverRole: updateDto.serverRole,
        kickMembers: updateDto.permissions.kickMembers,
        banMembers: updateDto.permissions.banMembers,
        manageRoles: updateDto.permissions.manageRoles,
      });
    } else {
      permission.kickMembers = updateDto.permissions.kickMembers;
      permission.banMembers = updateDto.permissions.banMembers;
      permission.manageRoles = updateDto.permissions.manageRoles;
    }

    const savedPermission = await this.permissionRepository.save(permission);

    return {
      permissionPk: savedPermission.permissionPk,
      serverPk: savedPermission.serverPk,
      serverRole: savedPermission.serverRole,
      kickMembers: savedPermission.kickMembers,
      banMembers: savedPermission.banMembers,
      manageRoles: savedPermission.manageRoles,
    };
  }

  // 특정 역할의 특정 권한 확인 헬퍼 메서드
  async hasPermission(
    serverPk: number,
    userPk: number,
    permission: 'kickMembers' | 'banMembers' | 'manageRoles',
  ): Promise<boolean> {
    // 1. 사용자의 서버 멤버십 확인
    const serverMember = await this.serverMemberRepository.findOne({
      where: { serverPk, userPk, sStatus: 'Active' },
    });

    if (!serverMember) {
      return false;
    }

    // 2. 해당 역할의 권한 설정 조회
    const rolePermission = await this.permissionRepository.findOne({
      where: { serverPk, serverRole: serverMember.serverRole },
    });

    if (!rolePermission) {
      return false;
    }

    // 3. 요청된 권한 확인
    return rolePermission[permission];
  }

  // 서버 생성 시 기본 권한 설정
  async createDefaultPermissions(serverPk: number): Promise<void> {
    const defaultPermissions = [
      {
        serverPk,
        serverRole: 'owner' as const,
        kickMembers: true,
        banMembers: true,
        manageRoles: true,
      },
      {
        serverPk,
        serverRole: 'admin' as const,
        kickMembers: true,
        banMembers: true,
        manageRoles: true,
      },
      {
        serverPk,
        serverRole: 'projectManager' as const,
        kickMembers: true,
        banMembers: true,
        manageRoles: false,
      },
      {
        serverPk,
        serverRole: 'member' as const,
        kickMembers: false,
        banMembers: false,
        manageRoles: false,
      },
    ];

    await this.permissionRepository.save(defaultPermissions);
  }
}
