"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useModal, ProjectInviteData } from "../hooks/useModal";
import { useRouter } from "next/navigation";
import {
  useUserMemberListQuery,
  useInviteProjectMutation,
} from "../hooks/useServerMutation";
import { MemberInfo } from "../types/Server";
import { useResponsive } from "../../lib/useResponsive";

const AddProjectInviteModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isProjectInviteModal, close, data } = useModal();
  const router = useRouter();

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const projectInviteData = data as ProjectInviteData;

  // 서버 멤버 목록 조회
  const memberListQuery = useUserMemberListQuery(
    projectInviteData?.serverUrl || ""
  );

  // 프로젝트 초대 뮤테이션
  const inviteProjectMutation = useInviteProjectMutation(
    projectInviteData?.serverUrl || "",
    projectInviteData?.projectPk || 0
  );

  // 멤버 선택/해제
  const handleMemberSelect = (userEmail: string) => {
    const newSelectedMembers = new Set(selectedMembers);
    if (newSelectedMembers.has(userEmail)) {
      newSelectedMembers.delete(userEmail);
    } else {
      newSelectedMembers.add(userEmail);
    }
    setSelectedMembers(newSelectedMembers);
  };

  // 모든 멤버 선택/해제
  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(
        new Set(filteredMembers.map((member) => member.userInfo.userEmail))
      );
    }
  };

  // 선택된 멤버들 초대
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectInviteData || selectedMembers.size === 0) return;

    setIsLoading(true);
    try {
      // 선택된 멤버들을 한 번에 초대
      const userEmails = Array.from(selectedMembers);
      await inviteProjectMutation.mutateAsync(userEmails);

      console.log(
        `✅ ${selectedMembers.size}명의 멤버를 프로젝트에 초대했습니다.`
      );

      // 성공 시 모달 닫기
      handleClose();
    } catch (error) {
      console.error("❌ 프로젝트 초대 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers(new Set());
    setSearchQuery("");
    setIsLoading(false);
    close();
  };

  // 멤버 목록 필터링
  const filteredMembers = (memberListQuery.data || []).filter(
    (member: MemberInfo) =>
      member.userInfo.userName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      member.userInfo.userEmail
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const modalContent = (
    <AnimatePresence>
      {isOpen && isProjectInviteModal && (
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
                  프로젝트에 멤버 초대
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              {/* 스크롤 가능한 콘텐츠 */}
              <div className="overflow-y-auto px-4 pb-4 max-h-[calc(90vh-80px)]">
                {/* 검색 입력 */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이메일로 검색..."
                    className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 선택된 멤버 수 */}
                {selectedMembers.size > 0 && (
                  <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      {selectedMembers.size}명의 멤버를 선택했습니다
                    </p>
                  </div>
                )}

                {/* 멤버 리스트 */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.userInfo.userEmail}
                      onClick={() =>
                        handleMemberSelect(member.userInfo.userEmail)
                      }
                      className="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.userInfo.userEmail)}
                        onChange={() => {}} // onClick에서 처리
                        className="mr-3 rounded border-gray-600 bg-gray-700"
                        readOnly
                      />
                      <div className="rounded-full bg-blue-500 flex items-center justify-center text-white font-bold w-8 h-8 text-sm mr-3">
                        {member.userInfo.userEmail[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {member.userInfo.userEmail}
                        </p>
                        <p className="text-gray-400 text-xs">멤버</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 버튼 그룹 */}
                <div className="flex space-x-2 pt-4 pb-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors py-2 text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      selectedMembers.size === 0 ||
                      inviteProjectMutation.isPending
                    }
                    className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2 text-sm"
                  >
                    {inviteProjectMutation.isPending
                      ? "초대 중..."
                      : `${selectedMembers.size}명 초대`}
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
              <div
                className={`flex justify-between items-center ${
                  isMobile ? "mb-4" : "mb-6"
                }`}
              >
                <h2
                  className={`font-semibold text-white ${
                    isMobile ? "text-lg" : "text-xl"
                  }`}
                >
                  프로젝트에 멤버 초대하기
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

              <div className={`${isMobile ? "space-y-3" : "space-y-4"}`}>
                {/* 프로젝트 정보 */}
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
                      📁
                    </span>
                    <div
                      className={`text-blue-300 ${
                        isMobile ? "text-xs" : "text-sm"
                      }`}
                    >
                      <div className="font-medium">
                        {projectInviteData?.projectName} 프로젝트
                      </div>
                      <div>
                        선택한 멤버들을 이 프로젝트에 초대할 수 있습니다.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 검색 */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    멤버 검색
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="이름 또는 이메일로 검색..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 전체 선택 */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        selectedMembers.size === filteredMembers.length &&
                        filteredMembers.length > 0
                      }
                      onChange={handleSelectAll}
                      className="mr-2 rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-white text-sm">전체 선택</span>
                  </label>
                  <span className="text-gray-400 text-sm">
                    {selectedMembers.size}명 선택됨
                  </span>
                </div>

                {/* 멤버 목록 */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {memberListQuery.isLoading ? (
                    <div className="text-center py-4">
                      <div className="text-gray-400">
                        멤버 목록을 불러오는 중...
                      </div>
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-gray-400">검색 결과가 없습니다.</div>
                    </div>
                  ) : (
                    filteredMembers.map((member: MemberInfo) => (
                      <div
                        key={member.userInfo.userEmail}
                        onClick={() =>
                          handleMemberSelect(member.userInfo.userEmail)
                        }
                        className="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(
                            member.userInfo.userEmail
                          )}
                          onChange={() => {}} // onClick에서 처리
                          className="mr-3 rounded border-gray-600 bg-gray-700"
                        />
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                            {member.userInfo.ProfileImageUrl ? (
                              <img
                                src={member.userInfo.ProfileImageUrl}
                                alt={member.userInfo.userName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-sm font-semibold">
                                {member.userInfo.userName
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium flex items-center">
                              {member.userInfo.userName}
                              {member.serverRole === "owner" && (
                                <span className="ml-2 px-1 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">
                                  소유자
                                </span>
                              )}
                              {member.serverRole === "admin" && (
                                <span className="ml-2 px-1 py-0.5 bg-purple-600 text-purple-100 text-xs rounded">
                                  관리자
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {member.userInfo.userEmail}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-white hover:underline transition-colors"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={selectedMembers.size === 0 || isLoading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        초대 중...
                      </>
                    ) : (
                      `${selectedMembers.size}명 초대하기`
                    )}
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

export default AddProjectInviteModal;
