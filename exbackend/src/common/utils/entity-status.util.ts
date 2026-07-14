import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

export async function findActiveEntityById<T extends { [key: string]: any }>(
  repository: Repository<T>,
  id: number | string, // pk 또는 url
  entityName: string, // 서버 | 프로젝트 | 채널
  idKey: string,
  isDeletedKey: string,
): Promise<void> { 
  // 1. 먼저 idKey와 isDeletedKey가 false인 활성 엔티티를 찾습니다.
  const activeEntity = await repository.findOne({
    where: {
      [idKey]: id,
      [isDeletedKey]: false, // 명시적으로 삭제되지 않은 항목을 찾습니다.
    } as any,
  });

  if (activeEntity) {
    // 활성 엔티티가 존재하면 유효성 검사 통과
    return;
  }

  // 2. 활성 엔티티를 찾지 못했다면, idKey에 해당하는 어떤 엔티티라도 존재하는지 확인합니다.
  // (삭제된 엔티티일 수 있습니다.)
  const anyEntity = await repository.findOne({
    where: { [idKey]: id } as any,
  });

  if (!anyEntity) {
    // 활성 또는 삭제된 모든 엔티티 중에서 idKey에 해당하는 엔티티가 전혀 없다면
    throw new NotFoundException(`${entityName}를 찾을 수 없습니다.`);
  }

  // anyEntity가 존재하지만 activeEntity가 발견되지 않았다면, 이는 anyEntity가 삭제된 상태임을 의미합니다.
  if (anyEntity[isDeletedKey]) {
    throw new BadRequestException(`${entityName}는 이미 삭제되었습니다.`);
  }

  // 이 코드는 isDeletedKey가 boolean 타입이고 데이터가 일관적이라면 이론적으로 도달할 수 없습니다.
  // 활성 상태도 아니고 명시적으로 삭제된 상태도 아닌 엔티티가 존재함을 의미합니다.
  // 데이터 불일치 가능성에 대한 일반적인 오류를 반환합니다.
  throw new BadRequestException(`${entityName}의 상태를 확인할 수 없습니다. 데이터 불일치 가능성.`);
}
