"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal, ProjectData } from "../hooks/useModal";
import { useCreateProjectMutation } from "../hooks/useServerMutation";
import { useRouter } from "next/navigation";

const AddProjectModal = () => {
  const { isOpen, isProjectAddModal, close, data } = useModal();
  const createProjectMutation = useCreateProjectMutation();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const projectData = data as ProjectData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectData) return;

    try {
      const newProjectData = {
        projectName,
        projectDescription: projectDescription.trim() || undefined,
      };

      console.log("🚀 프로젝트 생성 시작:", newProjectData);

      const newProject = await createProjectMutation.mutateAsync({
        serverUrl: projectData.serverUrl,
        projectData: newProjectData,
      });

      console.log("✅ 서버에서 프로젝트 생성 성공:", newProject);

      // 성공 시 모달 닫기
      handleClose();

      // 현재 URL에서 serverId 추출
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split("/");
      const serverIndex =
        pathParts.findIndex((part) => part === "projects") - 1;
      const serverId = pathParts[serverIndex];

      console.log(
        `🔗 프로젝트 이동: '${newProject.projectName}' (PK: ${newProject.projectPk})`
      );

      // 새 프로젝트의 기본 채널로 이동 (projectPk 사용)
      router.push(
        `/${serverId}/projects/${newProject.projectPk}/channels/general`
      );

      // 페이지 새로고침으로 프로젝트 목록 업데이트
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("❌ 프로젝트 생성 실패:", error);
    }
  };

  const handleClose = () => {
    setProjectName("");
    setProjectDescription("");
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && isProjectAddModal && (
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                새 프로젝트 만들기
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 프로젝트 이름 */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  프로젝트 이름 *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    📁
                  </span>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="프로젝트 이름을 입력하세요"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={createProjectMutation.isPending}
                  />
                </div>
              </div>

              {/* 프로젝트 설명 */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  프로젝트 설명 (선택사항)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={createProjectMutation.isPending}
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="mr-2 text-blue-400 text-sm">💡</span>
                  <div className="text-blue-300 text-sm">
                    <div className="font-medium mb-1">프로젝트 생성 후</div>
                    <div>
                      기본 &apos;general&apos; 채널이 자동으로 생성됩니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-white hover:underline transition-colors"
                  disabled={createProjectMutation.isPending}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    !projectName.trim() || createProjectMutation.isPending
                  }
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {createProjectMutation.isPending
                    ? "생성 중..."
                    : "프로젝트 만들기"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddProjectModal;
