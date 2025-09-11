"use-client";

import React from "react";
import { ProjectManageData, useModal } from "../hooks/useModal";
import { useProjectFlow } from "../hooks/useProjectFlow";
import { useProjectMemberListQuery } from "../hooks/useServerMutation";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export const ProjectManageModal = () => {
  const { isOpen, isProjectManageModal, close, data } = useModal();
  const projectData = data as ProjectManageData;
  const queryClient = useQueryClient();

  const { handleBanMember, handleUnbanMember } = useProjectFlow(
    projectData?.serverUrl || "",
    projectData?.projectPk || 0
  );

  const ProjectMemberList = useProjectMemberListQuery(
    projectData?.serverUrl || "",
    projectData?.projectPk || 0
  );
  const {
    data: projectMemberList,
    isLoading: isProjectMemberListLoading,
    error: projectMemberListError,
  } = ProjectMemberList;

  if (isProjectMemberListLoading) {
    return <div>Loading...</div>;
  }

  if (projectMemberListError) {
    return <div>Error: {projectMemberListError.message}</div>;
  }

  const handleClose = () => {
    close();
  };

  const banMember = async (memberEmail: string) => {
    try {
      const response = await handleBanMember(memberEmail);

      // 성공 후 프로젝트 멤버 목록 캐시 업데이트
      await queryClient.invalidateQueries({
        queryKey: [
          "projectMemberList",
          projectData?.serverUrl,
          projectData?.projectPk,
        ],
      });

      console.log("✅ 프로젝트 멤버 차단 성공 및 캐시 업데이트 완료");
      return response;
    } catch (error) {
      console.error("❌ 프로젝트 멤버 차단 실패:", error);
      throw error;
    }
  };

  const unbanMember = async (memberEmail: string) => {
    try {
      const response = await handleUnbanMember(memberEmail);

      // 성공 후 프로젝트 멤버 목록 캐시 업데이트
      await queryClient.invalidateQueries({
        queryKey: [
          "projectMemberList",
          projectData?.serverUrl,
          projectData?.projectPk,
        ],
      });

      console.log("✅ 프로젝트 멤버 차단 해제 성공 및 캐시 업데이트 완료");
      return response;
    } catch (error) {
      console.error("❌ 프로젝트 멤버 차단 해제 실패:", error);
      throw error;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && isProjectManageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md mx-auto bg-gray-700 rounded-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-3">👥</span>
                프로젝트 멤버 관리
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 멤버 수 정보 */}
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="mr-2 text-blue-400">📊</span>
                  <div className="text-blue-300 text-sm">
                    <div className="font-medium">멤버 현황</div>
                    <div>
                      총 {projectMemberList?.length || 0}명의 멤버가 있습니다
                    </div>
                  </div>
                </div>
              </div>

              {/* 멤버 목록 */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {projectMemberList?.map((member) => (
                  <div
                    key={member.userInfo.userEmail}
                    className="p-3 bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        {/* 프로필 아바타 */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            member.pStatus === "Active"
                              ? "bg-green-600"
                              : "bg-red-600"
                          }`}
                        >
                          <span className="text-white text-sm font-semibold">
                            {member.userInfo.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="text-white font-medium flex items-center">
                            {member.userInfo.userName}
                            {member.projectRole === "admin" && (
                              <span className="ml-2 px-1 py-0.5 bg-purple-600 text-purple-100 text-xs rounded">
                                관리자
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {member.userInfo.userEmail}
                          </div>
                          <div className="flex items-center mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                member.pStatus === "Active"
                                  ? "bg-green-600/20 text-green-300"
                                  : "bg-red-600/20 text-red-300"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  member.pStatus === "Active"
                                    ? "bg-green-400"
                                    : "bg-red-400"
                                }`}
                              ></span>
                              {member.pStatus === "Active" ? "활성" : "차단됨"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="ml-3">
                        {member.pStatus === "Active" ? (
                          <button
                            onClick={() => banMember(member.userInfo.userEmail)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            차단
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              unbanMember(member.userInfo.userEmail)
                            }
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            차단 해제
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 빈 상태 */}
              {(!projectMemberList || projectMemberList.length === 0) && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">
                    멤버가 없습니다
                  </h3>
                  <p className="text-gray-400">
                    프로젝트에 멤버를 초대해보세요.
                  </p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-white hover:underline transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
