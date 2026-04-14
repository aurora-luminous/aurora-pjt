import { ServerMember } from '../entities/server-member.entity';

export abstract class ServerMemberRepository {
  /**
   * 단일 멤버 조회
   */
  abstract findOne(
    options: {
      serverMemberPk?: number;
      serverPk?: number;
      serverUrl?: string;
      userPk?: number;
      sStatus?: 'Pending' | 'Active' | 'Inactive' | 'Banned' ;
      serverRole?: 'member' | 'admin' | 'owner' | 'projectManager';
    },
    relations?: string[]
  ): Promise<ServerMember | null>;

  /**
   * 멤버 목록 조회
   */
  abstract findAll(
    options: {
      serverPk?: number;
      userPk?: number;
      sStatus?: 'Pending' | 'Active' | 'Inactive' | 'Banned';
    },
    relations?: string[],
    order?: { [key: string]: 'ASC' | 'DESC' }
  ): Promise<ServerMember[]>;

  /**
   * 멤버 수 카운트
   */
  abstract count(
    options: {
      serverPk: number;
      sStatus?: 'Pending' | 'Active' | 'Inactive' | 'Banned';
      serverRole?: 'member' | 'admin' | 'owner' | 'projectManager';
    }
  ): Promise<number>;

  /**
   * 단일 멤버 저장 및 업데이트
   */
  abstract save(member: Partial<ServerMember>): Promise<ServerMember>;

  /**
   * 대량 멤버 저장 및 업데이트
   */
  abstract saveMany(members: Partial<ServerMember>[]): Promise<ServerMember[]>;

}
