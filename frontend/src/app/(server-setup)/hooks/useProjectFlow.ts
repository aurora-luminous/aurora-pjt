import {
  useBanProjectMemberMutation,
  useLeaveProjectMutation,
  useUnbanProjectMemberMutation,
} from "./useServerMutation";

export const useProjectFlow = (serverUrl: string, projectPk: number) => {
  const banProjectMemberMutation = useBanProjectMemberMutation(
    serverUrl,
    projectPk
  );
  const unbanProjectMemberMutation = useUnbanProjectMemberMutation(
    serverUrl,
    projectPk
  );
  const leaveProjectMutation = useLeaveProjectMutation(serverUrl, projectPk);

  const handleLeaveProject = async (memberEmail: string) => {
    try {
      const response = await leaveProjectMutation.mutateAsync(memberEmail);
      return response;
    } catch (error) {
      console.error("❌ 프로젝트 멤버 탈퇴 실패:", error);
      throw error;
    }
  };

  const handleBanMember = async (memberEmail: string) => {
    try {
      const response = await banProjectMemberMutation.mutateAsync(memberEmail);
      return response;
    } catch (error) {
      console.error("❌ 프로젝트 멤버 차단 실패:", error);
      throw error;
    }
  };

  const handleUnbanMember = async (memberEmail: string) => {
    try {
      const response = await unbanProjectMemberMutation.mutateAsync(
        memberEmail
      );
      return response;
    } catch (error) {
      console.error("❌ 프로젝트 멤버 차단 해제 실패:", error);
      throw error;
    }
  };

  return {
    handleLeaveProject,
    handleBanMember,
    handleUnbanMember,
  };
};
