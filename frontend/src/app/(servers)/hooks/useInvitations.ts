import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Invitation } from "../[server_id]/admin/components/InviteCard";

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const mockInvitations: Invitation[] = [
  {
    id: "1",
    code: "abc123def",
    url: "https://aurora.dev/invite/abc123def",
    createdBy: "김관리자",
    createdAt: "2023-12-01T10:00:00Z",
    expiresAt: "2023-12-08T10:00:00Z",
    maxUses: 10,
    uses: 3,
    isActive: true,
  },
  {
    id: "2",
    code: "xyz789ghi",
    url: "https://aurora.dev/invite/xyz789ghi",
    createdBy: "이모더레이터",
    createdAt: "2023-12-10T15:30:00Z",
    expiresAt: "2023-12-17T15:30:00Z",
    maxUses: 1,
    uses: 1,
    isActive: false,
  },
  {
    id: "3",
    code: "qwe456rty",
    url: "https://aurora.dev/invite/qwe456rty",
    createdBy: "박개발자",
    createdAt: "2023-12-05T09:15:00Z",
    maxUses: undefined,
    uses: 25,
    isActive: true,
  },
];

export const useInvitationsPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;

  // 상태 관리
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 초대 생성
  const handleCreateInvite = useCallback(
    async (inviteData: { expiresAt?: string; maxUses?: number }) => {
      console.log("초대 생성:", inviteData);

      try {
        // 실제 API 호출 로직
        // await createInvite(serverId, inviteData);

        const newInvitation: Invitation = {
          id: Date.now().toString(),
          code: Math.random().toString(36).substring(2, 15),
          url: `https://aurora.dev/invite/${Math.random()
            .toString(36)
            .substring(2, 15)}`,
          createdBy: "현재 사용자", // 실제로는 현재 사용자 정보
          createdAt: new Date().toISOString(),
          expiresAt: inviteData.expiresAt,
          maxUses: inviteData.maxUses,
          uses: 0,
          isActive: true,
        };

        setInvitations((prev) => [newInvitation, ...prev]);
        console.log("✅ 초대 생성 완료");
      } catch (error) {
        console.error("❌ 초대 생성 실패:", error);
      }
    },
    [serverId]
  );

  // 초대 삭제
  const handleDeleteInvite = useCallback(
    async (invitationId: string) => {
      console.log("초대 삭제:", invitationId);

      if (confirm("이 초대를 삭제하시겠습니까?")) {
        try {
          // 실제 API 호출 로직
          // await deleteInvite(serverId, invitationId);

          setInvitations((prev) =>
            prev.filter((invite) => invite.id !== invitationId)
          );
          console.log("✅ 초대 삭제 완료");
        } catch (error) {
          console.error("❌ 초대 삭제 실패:", error);
        }
      }
    },
    [serverId]
  );

  // 초대 링크 복사
  const handleCopyInvite = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      console.log("✅ 초대 링크 복사 완료");
      // 실제로는 토스트 메시지 표시
      alert("초대 링크가 클립보드에 복사되었습니다!");
    } catch (error) {
      console.error("❌ 초대 링크 복사 실패:", error);
      // 실제로는 토스트 메시지 표시
      alert("초대 링크 복사에 실패했습니다.");
    }
  }, []);

  return {
    // 데이터
    invitations,
    isLoading,
    error,
    showCreateModal,

    // 상태 설정
    setShowCreateModal,

    // 핸들러
    handleCreateInvite,
    handleDeleteInvite,
    handleCopyInvite,
  };
};
