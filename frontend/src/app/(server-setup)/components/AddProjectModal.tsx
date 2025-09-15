"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useModal, ProjectData } from "../hooks/useModal";
import { useCreateProjectMutation } from "../hooks/useServerMutation";
import { useRouter } from "next/navigation";
import { useResponsive } from "../../lib/useResponsive";

const AddProjectModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isProjectAddModal, close, data } = useModal();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const projectData = data as ProjectData;

  // useServerMutation 사용
  const createProjectMutation = useCreateProjectMutation(
    projectData?.serverUrl || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectData) return;

    try {
      const newProjectData = {
        projectName,
        projectDescription: projectDescription.trim() || undefined,
      };

      console.log("🚀 프로젝트 생성 시작:", newProjectData);

      const newProject = await createProjectMutation.mutateAsync(
        newProjectData
      );

      if (!newProject) {
        throw new Error("프로젝트 생성에 실패했습니다.");
      }

      console.log("✅ 서버에서 프로젝트 생성 성공:", newProject);

      // 성공 시 모달 닫기
      handleClose();

      // 현재 URL에서 serverId 추출
      const currentPath = window.location.pathname;
      const serverIdMatch = currentPath.match(/\/servers\/([^\/]+)/);
      const serverId = serverIdMatch ? serverIdMatch[1] : "";

      if (serverId) {
        // 새 프로젝트로 이동
        const targetUrl = `/servers/${serverId}/projects/${newProject.projectPk}/channels/general`;
        router.push(targetUrl);
      } else {
        console.error("❌ URL에서 serverId를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("❌ 프로젝트 생성 실패:", error);
    }
  };

  const handleClose = () => {
    setProjectName("");
    setProjectDescription("");
    close();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && isProjectAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={handleClose}
        >
          {isMobile ? (
            // 모바일: Bottom Sheet
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-gray-700 rounded-t-xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>

              {/* 헤더 */}
              <div className="flex justify-between items-center px-4 pb-4">
                <h2 className="text-lg font-semibold text-white">
                  새 프로젝트 만들기
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              {/* 스크롤 가능한 콘텐츠 */}
              <div className="overflow-y-auto px-4 pb-4 max-h-[calc(85vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">
                      프로젝트 이름
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="새로운 프로젝트"
                      className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={createProjectMutation.isPending}
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">
                      프로젝트 설명
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={createProjectMutation.isPending}
                    />
                  </div>

                  <div className="flex space-x-2 pt-2 pb-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors py-2 text-sm"
                      disabled={createProjectMutation.isPending}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2 text-sm"
                      disabled={
                        createProjectMutation.isPending || !projectName.trim()
                      }
                    >
                      {createProjectMutation.isPending
                        ? "생성 중..."
                        : "프로젝트 만들기"}
                    </button>
                  </div>
                </form>
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-white text-xl">
                  새 프로젝트 만들기
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 프로젝트 이름 */}
                <div>
                  <label
                    className={`block text-white font-medium mb-2 ${
                      isMobile ? "text-sm" : "text-sm"
                    }`}
                  >
                    프로젝트 이름 *
                  </label>
                  <div className="relative">
                    <span
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
                        isMobile ? "text-sm" : "text-base"
                      }`}
                    >
                      📁
                    </span>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="프로젝트 이름을 입력하세요"
                      className={`w-full bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isMobile ? "pl-8 pr-3 py-2 text-sm" : "pl-10 pr-4 py-3"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* 프로젝트 설명 */}
                <div>
                  <label
                    className={`block text-white font-medium mb-2 ${
                      isMobile ? "text-sm" : "text-sm"
                    }`}
                  >
                    프로젝트 설명 (선택사항)
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                    rows={isMobile ? 2 : 3}
                    className={`w-full bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      isMobile ? "px-3 py-2 text-sm" : "px-4 py-3"
                    }`}
                  />
                </div>

                {/* 안내 메시지 */}
                <div
                  className={`bg-blue-600/10 border border-blue-600/20 rounded-lg ${
                    isMobile ? "p-2" : "p-3"
                  }`}
                >
                  <div className="flex items-start">
                    <span
                      className={`mr-2 text-blue-400 ${
                        isMobile ? "text-xs" : "text-sm"
                      }`}
                    >
                      💡
                    </span>
                    <div
                      className={`text-blue-300 ${
                        isMobile ? "text-xs" : "text-sm"
                      }`}
                    >
                      <div
                        className={`font-medium mb-1 ${
                          isMobile ? "text-xs" : "text-sm"
                        }`}
                      >
                        프로젝트 생성 후
                      </div>
                      <div className={isMobile ? "text-xs" : "text-sm"}>
                        기본 &apos;general&apos; 채널이 자동으로 생성됩니다.
                      </div>
                    </div>
                  </div>
                </div>

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
                    type="submit"
                    disabled={!projectName.trim()}
                    className={`flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                      isMobile ? "py-2 text-sm" : "py-3"
                    }`}
                  >
                    프로젝트 만들기
                  </button>
                </div>
              </form>
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

export default AddProjectModal;
