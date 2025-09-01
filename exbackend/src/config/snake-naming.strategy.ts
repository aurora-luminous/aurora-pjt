import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

/**
 * TypeORM에서 camelCase 속성을 snake_case DB 컬럼으로 자동 변환하는 네이밍 전략
 * 
 * 사용 예시:
 * - 엔티티 속성: userPk → DB 컬럼: user_pk
 * - 엔티티 속성: userName → DB 컬럼: user_name
 * - 엔티티 속성: isDeletedServer → DB 컬럼: is_deleted_server
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  
  /**
   * 테이블명 네이밍 전략
   * @param className 엔티티 클래스명
   * @param customName @Entity() 데코레이터에서 지정한 커스텀 테이블명
   * @returns 실제 DB 테이블명
   */
  tableName(className: string, customName: string): string {
    // 커스텀 이름이 있으면 그대로 사용, 없으면 snake_case로 변환
    return customName ? customName : this.toSnakeCase(className);
  }

  /**
   * 컬럼명 네이밍 전략
   * @param propertyName 엔티티 속성명
   * @param customName @Column() 데코레이터에서 지정한 커스텀 컬럼명
   * @param embeddedPrefixes 임베디드 엔티티의 접두사들
   * @returns 실제 DB 컬럼명
   */
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    // 임베디드 접두사가 있으면 snake_case로 변환하여 접두사로 사용
    const prefix = embeddedPrefixes.length ? this.toSnakeCase(embeddedPrefixes.join('_')) + '_' : '';
    // 커스텀 이름이 있으면 그대로 사용, 없으면 snake_case로 변환
    return prefix + (customName ? customName : this.toSnakeCase(propertyName));
  }

  /**
   * 관계(relation) 이름 네이밍 전략
   * @param propertyName 관계 속성명
   * @returns snake_case로 변환된 관계명
   */
  relationName(propertyName: string): string {
    return this.toSnakeCase(propertyName);
  }

  /**
   * 외래키 컬럼명 네이밍 전략
   * @param relationName 관계명
   * @param referencedColumnName 참조되는 컬럼명
   * @returns 외래키 컬럼명 (예: user_id, server_pk)
   */
  joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.toSnakeCase(relationName + '_' + referencedColumnName);
  }

  /**
   * 중간 테이블명 네이밍 전략 (Many-to-Many 관계)
   * @param firstTableName 첫 번째 테이블명
   * @param secondTableName 두 번째 테이블명
   * @returns 중간 테이블명 (예: user_role, server_member)
   */
  joinTableName(firstTableName: string, secondTableName: string): string {
    return this.toSnakeCase(firstTableName + '_' + secondTableName);
  }

  /**
   * camelCase 문자열을 snake_case로 변환하는 헬퍼 메서드
   * 
   * 변환 규칙:
   * 1. 대문자 앞에 언더스코어(_) 추가
   * 2. 전체를 소문자로 변환
   * 3. 맨 앞의 언더스코어 제거 (첫 글자가 대문자인 경우 대비)
   * 
   * @param str 변환할 camelCase 문자열
   * @returns snake_case로 변환된 문자열
   * 
   * @example
   * toSnakeCase('userPk') // 'user_pk'
   * toSnakeCase('userName') // 'user_name'
   * toSnakeCase('isDeletedServer') // 'is_deleted_server'
   * toSnakeCase('XMLHttpRequest') // 'xml_http_request'
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')  // 대문자 앞에 _ 추가: userPk → user_Pk
      .toLowerCase()               // 소문자로 변환: user_Pk → user_pk
      .replace(/^_/, '');          // 맨 앞 _ 제거: _user_pk → user_pk
  }
}