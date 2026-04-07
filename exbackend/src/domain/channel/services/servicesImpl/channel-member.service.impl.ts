import {
   Injectable,
   NotFoundException,
   ConflictException,
   ForbiddenException,
   UnauthorizedException,
 } from '@nestjs/common';
 import { ChannelMemberService } from '../channel-member.service';
 import { ChannelRepository } from '../../repositories/channel.repository';
 import { ChannelMemberRepository } from '../../repositories/channel-member.repository';
 import { ChannelNotificationService } from '../channel-notofication.service';
 import { UserService } from 'src/domain/user/services/user.service';
 import {
   BulkInviteToChannelDto,
   ChannelMemberDto,
   RemoveFromChannelDto,
 } from '../../dto';
 import { MemberRole, MemberStatus, MemberRoleUtils } from 'src/common/enums';
 import { ChannelMember } from '../../entities/channel-member.entity';

 @Injectable()
 export class ChannelMemberServiceImpl extends ChannelMemberService {
   constructor(
     private readonly ChannelRepository: ChannelRepository,
     private readonly channelMemberRepository: ChannelMemberRepository,
     private readonly userService: UserService,
     private readonly notificationservice: ChannelNotificationService,
   ) {
     super();
   }

   /**
    * 1. 멤버 초대 (이메일 배열 처리)
    */
   async inviteUsersToChannel(
     dto: BulkInviteToChannelDto,
   ): Promise<{ message: string }> {
     const { channelPk, inviterUserPk, users } = dto;

     const channel = await this.ChannelRepository.findOne({ channelPk });
     if (!channel) throw new NotFoundException(`채널을 찾을 수 없습니다.`);

     const inviter = await this.channelMemberRepository.findOne({
       channelPk,
       userPk: inviterUserPk,
       channelRole: MemberRole.ADMIN,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!inviter) throw new ForbiddenException('초대 권한이 없습니다.');

     const result = await Promise.all(
       users.map(async (user) => {
         try {
           const targetUser = await this.userService.getUserByEmail(user.userEmail);
           if (!targetUser) return { email: user.userEmail, status: 'failed', reason: '존재하지 않는 사용자' };

           await this._processSingleInvitation(channelPk, targetUser.userPk, MemberRole.MEMBER);
           return { email: user.userEmail, status: 'success' };
         } catch (error) {
           return { email: user.userEmail, status: 'failed', reason: error.message };
         }
       }),
     );

     const successCount = result.filter((r) => r?.status === 'success').length;
     return { message: `${users.length}명 중 ${successCount}명을 성공적으로 초대했습니다.` };
   }

   /**
    * 1-1. 초대 처리 내부 로직 (저장 + 알림)
    */
   private async _processSingleInvitation(
     channelPk: number,
     userPk: number,
     role: MemberRole,
   ): Promise<ChannelMemberDto> {
     let member = await this.channelMemberRepository.findOne({ channelPk, userPk });

     if (member) {
       if (member.cStatus === MemberStatus.ACTIVE) throw new ConflictException('이미 채널의 멤버입니다.');
       if (member.cStatus === MemberStatus.BANNED) throw new ForbiddenException('차단된 유저입니다.');

       member.cStatus = MemberStatus.ACTIVE;
       member.channelRole = role;
     } else {
       member = {
         channelPk,
         userPk,
         cStatus: MemberStatus.ACTIVE,
         channelRole: role,
         isMute: false,
       } as ChannelMember;
     }

     const saved = await this.channelMemberRepository.save(member);

     // 알림 발송을 위한 유저 정보 조회
     const savedWithUser = await this.channelMemberRepository.findOne({ channelMemberPk: saved.channelMemberPk }, ['user']);
     if (!savedWithUser) throw new NotFoundException('저장된 멤버 정보를 찾을 수 없습니다.');

     this.notificationservice.notifyMemberAdded(
       [channelPk],
       savedWithUser.user.userEmail,
       savedWithUser.user.userName,
       savedWithUser.user.profileImagePath,
     ).catch(err => console.error('알림 전송 실패:', err));

     // 공통 헬퍼 메서드를 사용하여 DTO 반환
     return this._getMemberDtoWithUser(saved.channelMemberPk);
   }

   /**
    * 2. 공개 채널 참가
    */
   async joinPublicChannel(channelPk: number, userPk: number): Promise<ChannelMemberDto> {
     const channel = await this.ChannelRepository.findOne({ channelPk });
     if (!channel || channel.accessType !== 'PUBLIC') {
       throw new ForbiddenException('공개 채널만 직접 참가할 수 있습니다.');
     }

     return await this._processSingleInvitation(channelPk, userPk, MemberRole.MEMBER);
   }

   /**
    * 3. 채널 멤버 목록 조회
    */
   async getChannelMembers(channelPk: number, requestUserPk: number): Promise<ChannelMemberDto[]> {
     // 요청자 권한 확인 (활성 멤버인지)
     const isMember = await this.channelMemberRepository.findOne({ channelPk, userPk: requestUserPk, cStatus: MemberStatus.ACTIVE });
     if (!isMember) throw new ForbiddenException('채널 멤버만 목록을 조회할 수 있습니다.');

     const members = await this.channelMemberRepository.findAll({ channelPk, cStatus: MemberStatus.ACTIVE }, ['user']);

     return members.map((m) => ({
       cStatus: m.cStatus as MemberStatus,
       channelRole: m.channelRole as MemberRole,
       isMute: m.isMute,
       userInfo: {
         userName: m.user.userName,
         userEmail: m.user.userEmail,
         profileImagePath: m.user.profileImagePath,
       },
     }));
   }

   /**
    * 4. 멤버 강퇴 (관리자 권한 필요)
    */
   async removeUserFromChannel(dto: RemoveFromChannelDto): Promise<void> {
     const { channelPk, targetUserPk, adminUserPk } = dto;

     const admin = await this.channelMemberRepository.findOne({
       channelPk,
       userPk: adminUserPk,
       channelRole: MemberRole.ADMIN,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!admin) throw new ForbiddenException('관리자 권한이 없습니다.');

     const target = await this.channelMemberRepository.findOne({ channelPk, userPk: targetUserPk, cStatus: MemberStatus.ACTIVE });
     if (!target) throw new NotFoundException('대상 멤버를 찾을 수 없습니다.');

     target.cStatus = MemberStatus.INACTIVE;
     await this.channelMemberRepository.save(target);

     // 알림 발송
     const targetUser = await this.userService.getUserByPk(targetUserPk);
     if (targetUser) {
       this.notificationservice.notifyMemberRemoved(
         [channelPk],
         targetUser.userEmail,
         targetUser.userName,
         targetUser.profileImagePath,
       ).catch(err => console.error('알림 전송 실패:', err));
     }
   }

   /**
    * 5. 채널 나가기
    */
   async leaveChannel(channelPk: number, userPk: number): Promise<{ message: string }> {
     const member = await this.channelMemberRepository.findOne({
       channelPk,
       userPk,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!member) throw new NotFoundException('채널 멤버가 아닙니다.');

     member.cStatus = MemberStatus.INACTIVE;
     await this.channelMemberRepository.save(member);

     return { message: '채널에서 나갔습니다.' };
   }

   /**
    * 6. 멤버 차단 및 해제
    */
   async banUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<void> {
     const admin = await this.channelMemberRepository.findOne({
       channelPk,
       userPk: adminUserPk,
       channelRole: MemberRole.ADMIN,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!admin) throw new ForbiddenException('관리자 권한이 없습니다.');

     const target = await this.channelMemberRepository.findOne({ channelPk, userPk: targetUserPk });
     if (!target) throw new NotFoundException('대상 유저를 찾을 수 없습니다.');

     target.cStatus = MemberStatus.BANNED;
     await this.channelMemberRepository.save(target);
   }

   async unbanUserFromChannel(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<ChannelMemberDto> {
     const admin = await this.channelMemberRepository.findOne({
       channelPk,
       userPk: adminUserPk,
       channelRole: MemberRole.ADMIN,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!admin) throw new ForbiddenException('관리자 권한이 없습니다.');

     const target = await this.channelMemberRepository.findOne({ channelPk, userPk: targetUserPk, cStatus: MemberStatus.BANNED });
     if (!target) throw new NotFoundException('차단된 유저를 찾을 수 없습니다.');

     target.cStatus = MemberStatus.ACTIVE;
     const saved = await this.channelMemberRepository.save(target);

     return this._getMemberDtoWithUser(saved.channelMemberPk);
   }

   /**
    * 7. 멤버 권한 변경
    */
   async updateMemberRole(
     channelPk: number,
     targetUserPk: number,
     newRole: string,
     adminUserPk: number
   ): Promise<{ message: string }> {
     const admin = await this.channelMemberRepository.findOne({
       channelPk,
       userPk: adminUserPk,
       channelRole: MemberRole.ADMIN,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!admin) throw new ForbiddenException('관리자 권한이 없습니다.');

     const target = await this.channelMemberRepository.findOne({ channelPk, userPk: targetUserPk, cStatus: MemberStatus.ACTIVE });
     if (!target) throw new NotFoundException('멤버를 찾을 수 없습니다.');

     const role = newRole.toLowerCase() as MemberRole;
     if (!Object.values(MemberRole).includes(role)) throw new ConflictException('유효하지 않은 역할입니다.');

     target.channelRole = role;
     await this.channelMemberRepository.save(target);

     return { message: `역할이 ${newRole}로 변경되었습니다.` };
   }

   /**
    * 음소거 토글(미구현)
    */
   async toggleMemberMute(channelPk: number, targetUserPk: number, adminUserPk: number): Promise<ChannelMemberDto> {
     const admin = await this.channelMemberRepository.findOne({
       channelPk,
       userPk: adminUserPk,
       channelRole: MemberRole.ADMIN,
       cStatus: MemberStatus.ACTIVE,
     });
     if (!admin) throw new ForbiddenException('관리자 권한이 없습니다.');

     const target = await this.channelMemberRepository.findOne({ channelPk, userPk: targetUserPk, cStatus: MemberStatus.ACTIVE });
     if (!target) throw new NotFoundException('멤버를 찾을 수 없습니다.');

     target.isMute = !target.isMute;
     const saved = await this.channelMemberRepository.save(target);

     return this._getMemberDtoWithUser(saved.channelMemberPk);
   }

  /**
   * 공통 헬퍼: DTO 반환용 상세 조회 (Relation 포함)
   */
  private async _getMemberDtoWithUser(
    channelMemberPk: number,
  ): Promise<ChannelMemberDto> {
    const m = await this.channelMemberRepository.findOne({ channelMemberPk }, [
      'user',
    ]);
    if (!m) throw new NotFoundException('멤버 정보를 찾을 수 없습니다.');

    return {
      cStatus: m.cStatus as MemberStatus,
      channelRole: m.channelRole as MemberRole,
      isMute: m.isMute,
      userInfo: {
        userName: m.user.userName,
        userEmail: m.user.userEmail,
        profileImagePath: m.user.profileImagePath,
      },
    };
  }
}