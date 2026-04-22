import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ServerMember } from '../../entities/server-member.entity';
import { ServerMemberRepository } from '../server-member.repository';

@Injectable()
export class TypeOrmServerMemberRepository extends ServerMemberRepository {
  constructor(
    @InjectRepository(ServerMember)
    private readonly repository: Repository<ServerMember>,
  ) {
    super();
  }

  async findOne(
    options: {
      serverMemberPk?: number;
      serverPk?: number;
      userPk?: number;
      serverUrl?: string;
      sStatus?: 'Pending' | 'Active' | 'Inactive' | 'Banned';
      serverRole?: 'member' | 'admin' | 'owner' | 'projectManager';
    },
    relations?: string[]
  ): Promise<ServerMember | null> {
    const { serverMemberPk, serverPk, serverUrl, userPk, sStatus, serverRole } = options;
    
    // FindOptionsWhere -> where 절에서 엔티티에 정의된 실제 필드명들만 남기도록 필터링 해 주는 인터페이스
    // server_member 엔티티에 없는 serverUrl이 파라미터로 들어오기 때문에 사용함
    // serverUrl은 join 용임
    const whereCondition: FindOptionsWhere<ServerMember> = {
        ...(serverMemberPk && { serverMemberPk }),
        ...(serverPk && { serverPk }),
        ...(userPk && { userPk }),
        sStatus: sStatus ? sStatus: 'Active',
        ...(serverRole && { serverRole }),
    };

    // 조인 할 거면 삭제된 서버는 안 들고 오도록 명시  
    if (serverUrl) {
      whereCondition.server = {
        serverUrl: serverUrl,
        isDeletedServer: false,
      };
    }
    return this.repository.findOne({
      where: whereCondition,
      relations: relations || (serverUrl ? ['server'] : []),
    });
  }

  async findAll(
    options: {
      serverPk?: number;
      userPk?: number;
      sStatus?: 'Pending' | 'Active' | 'Inactive' | 'Banned';
    },
    relations?: string[],
    order?: { [key: string]: 'ASC' | 'DESC' }
  ): Promise<ServerMember[]> {
    const { serverPk, userPk, sStatus } = options;
    return this.repository.find({
      where: {
        ...(serverPk && { serverPk }),
        ...(userPk && { userPk }),
        sStatus: sStatus ? sStatus: 'Active',
      },
      relations: relations || [],
      order: order || { serverMemberPk: 'ASC' },
    });
  }

  async count(
    options: {
      serverPk: number;
      sStatus?: 'Pending' | 'Active' | 'Inactive' | 'Banned';
      serverRole?: 'member' | 'admin' | 'owner' | 'projectManager';
    }
  ): Promise<number> {
    const { serverPk, sStatus, serverRole } = options;
    return this.repository.count({
      where: {
        serverPk,
        sStatus: sStatus ? sStatus: 'Active',
        ...(serverRole && { serverRole }),
      },
    });
  }

  async save(member: Partial<ServerMember>): Promise<ServerMember> {
    return this.repository.save(member);
  }

  async saveMany(members: Partial<ServerMember>[]): Promise<ServerMember[]> {
    return this.repository.save(members);
  }
}