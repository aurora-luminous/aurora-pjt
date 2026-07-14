import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ServerRepository } from '../../repositories/server.repository';
import { ServerMemberRepository } from '../../repositories/server-member.repository';
import { ServerRoleRepository } from '../../repositories/server-role.repository';
import {
  UpdateRolePermissionDto,
  ServerRolePermissionResponseDto,
  GetServerPermissionsResponseDto,
} from '../../dto/server-role-permission.dto';
import { MemberStatus, ServerRole } from '../../../../common/enums';
import { ServerRolePermissionService } from '../server-role-permission.service';

@Injectable()
export class ServerRolePermissionServiceImpl extends ServerRolePermissionService {
  constructor(
    private readonly serverRoleRepository: ServerRoleRepository,
    private readonly serverRepository: ServerRepository,
    private readonly serverMemberRepository: ServerMemberRepository,
  ) {
    super();
  }

  // 서버 권한 조회
  async getServerPermissions(
    serverUrl: string,
    requestUserPk: number,
  ): Promise<GetServerPermissionsResponseDto> {
    // 1. 서버 존재 확인
    const server = await this.serverRepository.findOne({ serverUrl });

    if (!server) throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다`);
    

    // 2. 요청자가 서버 멤버인지 확인
    const requestMember = await this.serverMemberRepository.findOne(
      {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: MemberStatus.ACTIVE,
      },
    );

    if (!requestMember) throw new ForbiddenException('서버 멤버만 권한을 조회할 수 있습니다');
    

    // 3. 권한 목록 조회
    const permissions = await this.serverRoleRepository.findAll({ serverPk: server.serverPk });

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
    const server = await this.serverRepository.findOne({ serverUrl });

    if (!server) throw new NotFoundException(`서버 URL ${serverUrl}를 찾을 수 없습니다`);
    

    // 2. 요청자가 서버 소유자인지 확인
    const requestMember = await this.serverMemberRepository.findOne(
      {
        serverPk: server.serverPk,
        userPk: requestUserPk,
        sStatus: MemberStatus.ACTIVE,
      },
    );

    if (!requestMember || requestMember.serverRole !== 'owner') {
      throw new ForbiddenException('서버 소유자만 권한을 설정할 수 있습니다');
    }

    // 3. 기존 권한 설정 찾기 또는 생성
    const permission = await this.serverRoleRepository.findOne(
      { serverPk: server.serverPk, serverRole: updateDto.serverRole },
    );

    const permissionData = {
      ...(permission && { permissionPk: permission.permissionPk }),
      serverPk: server.serverPk,
      serverRole: updateDto.serverRole,
      kickMembers: updateDto.permissions.kickMembers,
      banMembers: updateDto.permissions.banMembers,
      manageRoles: updateDto.permissions.manageRoles,
    };

    //저장

    const savedPermission = await this.serverRoleRepository.save(permissionData);

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
    const serverMember = await this.serverMemberRepository.findOne({ serverPk, userPk, sStatus: MemberStatus.ACTIVE });

    if (!serverMember) {
      return false;
    }

    // 2. 해당 역할의 권한 설정 조회
    const rolePermission = await this.serverRoleRepository.findOne({ serverPk, serverRole: serverMember.serverRole });

    if (!rolePermission) return false;
    
    // 3. 요청된 권한 확인
    return rolePermission[permission];
  }

  // 서버 생성 시 기본 권한 설정
  async createDefaultPermissions(serverPk: number): Promise<void> {
    const defaultPermissions = [
      {
        serverPk,
        serverRole: ServerRole.OWNER,
        kickMembers: true,
        banMembers: true,
        manageRoles: true,
      },
      {
        serverPk,
        serverRole: ServerRole.ADMIN,
        kickMembers: true,
        banMembers: true,
        manageRoles: true,
      },
      {
        serverPk,
        serverRole: ServerRole.PROJECT_MANAGER,
        kickMembers: true,
        banMembers: true,
        manageRoles: false,
      },
      {
        serverPk,
        serverRole: ServerRole.MEMBER,
        kickMembers: false,
        banMembers: false,
        manageRoles: false,
      },
    ];

    await this.serverRoleRepository.saveMany(defaultPermissions);
  }
}
