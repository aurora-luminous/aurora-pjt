"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useModal } from "../hooks/useModal";
import { useProjectFlow } from "../hooks/useProjectFlow";
import { useProjectListQuery, useProjectMemberListQuery } from "../hooks/useServerMutation";
import { useQueryClient } from "@tanstack/react-query";
import { useResponsive } from "../../lib/useResponsive";
import type { ProjectManageData, ProjectPayload } from "../types";

export const ProjectManageModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isProjectManageModal, close, data } = useModal();
  const projectData = data as ProjectManageData;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  const { handleBanMember, handleUnbanMember, handleUpdateProject } = useProjectFlow(
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

 const projectList = useProjectListQuery(projectData?.serverUrl || "");
 console.log(projectList)

 const projectName = projectList.data?.filter((proejct) => proejct.projectPk === projectData?.projectPk)[0]?.projectName;

  // projectName이 로드되면 editedName 동기화
  useEffect(() => {
    if (projectName) {
      setEditedName(projectName);
    }
  }, [projectName]);

  const handleEditStart = () => {
    setEditedName(projectName || "");
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditedName(projectName || "");
    setIsEditing(false);
  };

  const handleEditSave = async () => {
    if (!editedName.trim() || editedName === projectName) {
      setIsEditing(false);
      return;
    }
    try {
      await updateProject({projectName: editedName.trim()});
      await queryClient.invalidateQueries({
        queryKey: ["projectList", projectData?.serverUrl],
      });
      setIsEditing(false);
    } catch (error) {
      console.error("❌ 프로젝트 이름 변경 실패:", error);
    }
  };

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

      console.log("✅ 프로젝트 멤버 차단 성공:", response);
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

      console.log("✅ 프로젝트 멤버 차단 해제 성공:", response);
    } catch (error) {
      console.error("❌ 프로젝트 멤버 차단 해제 실패:", error);
      throw error;
    }
  };

  const updateProject = async (payload: ProjectPayload) => {
    try {
      const response = await handleUpdateProject(payload);
      console.log(response)
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && isProjectManageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          {isMobile ? (
            // 모바일: Bottom Sheet
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-gray-700 rounded-t-xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>

              {/* 헤더 */}
              <div className="flex justify-between items-center px-4 pb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-3 text-base">👥</span>
                  프로젝트 관리
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>
              {/* 프로젝트 이름 수정 영역 (모바일) */}
              <div className="flex items-center gap-2 px-4 pb-3">
                <input
                  type="text"
                  value={editedName}
                  readOnly={!isEditing}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={`flex-1 text-white text-sm rounded-lg px-3 py-2 outline-none transition-all ${
                    isEditing
                      ? "bg-gray-600 border border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      : "bg-transparent border border-transparent cursor-default select-none"
                  }`}
                />
                {isEditing ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleEditSave}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="text-xs bg-gray-500 hover:bg-gray-400 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditStart}
                    className="text-xs bg-gray-500 hover:bg-gray-400 text-white px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap"
                  >
                    수정
                  </button>
                )}
              </div>

              {/* 스크롤 가능한 콘텐츠 */}
              <div className="overflow-y-auto px-4 pb-4 max-h-[calc(90vh-80px)]">
                {/* 멤버 리스트 */}
                <div className="space-y-2">
                  {ProjectMemberList.data?.map((member) => (
                    <div
                      key={member.userInfo.userEmail}
                      className="flex items-center justify-between bg-gray-600 rounded-lg p-3"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-blue-500 flex items-center justify-center text-white font-bold w-8 h-8 text-sm mr-3">
                          {member.userInfo.userEmail[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {member.userInfo.userEmail}
                          </p>
                          <p className="text-gray-300 text-xs">
                            {member.projectRole}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {member.pStatus !== "Banned" ? (
                          <button
                            onClick={() => banMember(member.userInfo.userEmail)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            차단
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              unbanMember(member.userInfo.userEmail)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            해제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 완료 버튼 */}
                <div className="pt-4 pb-4">
                  <button
                    onClick={handleClose}
                    className="w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium py-2 text-sm"
                  >
                    완료
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            // 데스크톱/태블릿: 기존 모달
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full mx-auto bg-gray-700 rounded-lg ${
                isTablet ? "max-w-lg p-5" : "max-w-md p-6"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div
                className={`flex justify-between items-center ${
                  isMobile ? "mb-4" : "mb-6"
                }`}
              >
                <h2
                  className={`font-semibold text-white flex items-center ${
                    isMobile ? "text-lg" : "text-xl"
                  }`}
                >
                  <span
                    className={`mr-3 ${isMobile ? "text-base" : "text-lg"}`}
                  >
                    👥
                  </span>
                  <span className={isMobile ? "text-sm" : "text-xl"}>
                    프로젝트 관리
                  </span>
                </h2>
                <button
                  onClick={handleClose}
                  className={`text-gray-400 hover:text-white transition-colors ${
                    isMobile ? "text-lg" : "text-xl"
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* 프로젝트 이름 수정 영역 (데스크톱/태블릿) */}
              <div className="flex items-center gap-2 mb-5">
                <input
                  type="text"
                  value={editedName}
                  readOnly={!isEditing}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={`flex-1 text-white rounded-lg px-3 py-2 outline-none transition-all ${
                    isTablet ? "text-sm" : "text-base"
                  } ${
                    isEditing
                      ? "bg-gray-600 border border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      : "bg-transparent border border-transparent cursor-default select-none"
                  }`}
                />
                {isEditing ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleEditSave}
                      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${
                        isTablet ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"
                      }`}
                    >
                      저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className={`bg-gray-500 hover:bg-gray-400 text-white rounded-lg transition-colors ${
                        isTablet ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"
                      }`}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditStart}
                    className={`bg-gray-500 hover:bg-gray-400 text-white font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isTablet ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"
                    }`}
                  >
                    수정
                  </button>
                )}
              </div>

              <div className={`${isMobile ? "space-y-3" : "space-y-4"}`}>
                {/* 멤버 수 정보 */}
                <div
                  className={`bg-blue-600/10 border border-blue-600/20 rounded-lg ${
                    isMobile ? "p-2" : "p-3"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-2 text-blue-400 ${
                        isMobile ? "text-sm" : "text-base"
                      }`}
                    >
                      📊
                    </span>
                    <div
                      className={`text-blue-300 ${
                        isMobile ? "text-xs" : "text-sm"
                      }`}
                    >
                      <div className="font-medium">멤버 현황</div>
                      <div>
                        총 {projectMemberList?.length || 0}명의 멤버가 있습니다
                      </div>
                    </div>
                  </div>
                </div>

                {/* 멤버 목록 */}
                <div
                  className={`overflow-y-auto ${
                    isMobile ? "max-h-64 space-y-2" : "max-h-96 space-y-2"
                  }`}
                >
                  {projectMemberList?.map((member) => (
                    <div
                      key={member.userInfo.userEmail}
                      className={`bg-gray-800 rounded-lg transition-colors ${
                        isMobile ? "p-2" : "p-3"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between ${
                          isMobile ? "flex-col space-y-2" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            isMobile ? "w-full" : "flex-1"
                          }`}
                        >
                          {/* 프로필 아바타 */}
                          <div
                            className={`rounded-full flex items-center justify-center ${
                              isMobile ? "w-6 h-6 mr-2" : "w-8 h-8 mr-3"
                            } ${
                              member.pStatus === "Active"
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                          >
                            <span
                              className={`text-white font-semibold ${
                                isMobile ? "text-xs" : "text-sm"
                              }`}
                            >
                              {member.userInfo.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div
                              className={`text-white font-medium flex items-center ${
                                isMobile ? "flex-col items-start space-y-1" : ""
                              }`}
                            >
                              <span
                                className={isMobile ? "text-sm" : "text-base"}
                              >
                                {member.userInfo.userName}
                              </span>
                              {member.projectRole === "admin" && (
                                <span
                                  className={`px-1 py-0.5 bg-purple-600 text-purple-100 rounded ${
                                    isMobile ? "text-xs ml-0" : "text-xs ml-2"
                                  }`}
                                >
                                  관리자
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-gray-400 ${
                                isMobile ? "text-xs" : "text-sm"
                              }`}
                            >
                              {member.userInfo.userEmail}
                            </div>
                            <div
                              className={`flex items-center ${
                                isMobile ? "mt-1" : "mt-1"
                              }`}
                            >
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                                  member.pStatus === "Active"
                                    ? "bg-green-600/20 text-green-300"
                                    : "bg-red-600/20 text-red-300"
                                } ${isMobile ? "text-xs" : "text-xs"}`}
                              >
                                <span
                                  className={`rounded-full mr-1 ${
                                    member.pStatus === "Active"
                                      ? "bg-green-400"
                                      : "bg-red-400"
                                  } ${isMobile ? "w-1.5 h-1.5" : "w-2 h-2"}`}
                                ></span>
                                {member.pStatus === "Active"
                                  ? "활성"
                                  : "차단됨"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className={isMobile ? "w-full" : "ml-3"}>
                          {member.pStatus === "Active" ? (
                            <button
                              onClick={() =>
                                banMember(member.userInfo.userEmail)
                              }
                              className={`bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors ${
                                isMobile
                                  ? "w-full px-2 py-1 text-xs"
                                  : "px-3 py-1 text-sm"
                              }`}
                            >
                              차단
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                unbanMember(member.userInfo.userEmail)
                              }
                              className={`bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors ${
                                isMobile
                                  ? "w-full px-2 py-1 text-xs"
                                  : "px-3 py-1 text-sm"
                              }`}
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
                  <div className={`text-center ${isMobile ? "py-6" : "py-8"}`}>
                    <div
                      className={`mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center ${
                        isMobile ? "w-12 h-12" : "w-16 h-16"
                      }`}
                    >
                      <svg
                        className={`text-gray-400 ${
                          isMobile ? "w-6 h-6" : "w-8 h-8"
                        }`}
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
                    <h3
                      className={`font-medium text-white mb-1 ${
                        isMobile ? "text-base" : "text-lg"
                      }`}
                    >
                      멤버가 없습니다
                    </h3>
                    <p
                      className={`text-gray-400 ${
                        isMobile ? "text-sm" : "text-base"
                      }`}
                    >
                      프로젝트에 멤버를 초대해보세요.
                    </p>
                  </div>
                )}

                {/* 버튼 그룹 */}
                <div
                  className={`flex ${
                    isMobile ? "space-x-2" : "space-x-3"
                  } pt-2`}
                >
                  <button
                    type="button"
                    onClick={handleClose}
                    className={`flex-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors ${
                      isMobile ? "py-2 text-sm" : "py-3"
                    }`}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleClose}
                    className={`flex-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium ${
                      isMobile ? "py-2 text-sm" : "py-3"
                    }`}
                  >
                    완료
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 모바일에서는 Portal을 사용하여 document.body에 직접 렌더링
  if (typeof window !== "undefined" && isMobile) {
    return createPortal(modalContent, document.body);
  }

  // 데스크톱/태블릿에서는 일반 렌더링
  return modalContent;
};
