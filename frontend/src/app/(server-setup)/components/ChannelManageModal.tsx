"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ChannelManageData, useModal } from "../hooks/useModal";
import { useChannelFlow } from "../hooks/useChannelFlow";
import { useChannelMemberListQuery } from "../hooks/useServerMutation";
import { useResponsive } from "../../lib/useResponsive";

export const ChannelManageModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isChannelManageModal, close, data } = useModal();
  const channelData = data as ChannelManageData;

  const { handleKickMember, handleBanMember, handleUnbanMember } =
    useChannelFlow(
      channelData?.serverUrl || "",
      channelData?.projectPk || 0,
      channelData?.channelPk || 0
    );

  const channelMemberList = useChannelMemberListQuery(
    channelData?.serverUrl || "",
    channelData?.projectPk || 0,
    channelData?.channelPk || 0
  );

  const {
    data: channelMemberListData,
    isLoading: isChannelMemberListLoading,
    error: channelMemberListError,
  } = channelMemberList;

  if (isChannelMemberListLoading) {
    return <div>Loading...</div>;
  }

  if (channelMemberListError) {
    return <div>Error: {channelMemberListError.message}</div>;
  }

  if (!channelMemberListData) {
    return <div>No data</div>;
  }

  const handleClose = () => {
    close();
  };

  const kickMember = async (userEmail: string) => {
    try {
      const response = await handleKickMember(userEmail);

      console.log("✅ 채널 멤버 추방 성공 및 캐시 업데이트 완료");
      return response;
    } catch (error) {
      console.error("❌ 채널 멤버 추방 실패:", error);
      throw error;
    }
  };

  const banMember = async (userEmail: string) => {
    try {
      const response = await handleBanMember(userEmail);

      console.log("✅ 채널 멤버 차단 성공 및 캐시 업데이트 완료");
      return response;
    } catch (error) {
      console.error("❌ 채널 멤버 차단 실패:", error);
      throw error;
    }
  };

  const unbanMember = async (userEmail: string) => {
    try {
      const response = await handleUnbanMember(userEmail);

      console.log("✅ 채널 멤버 차단 해제 성공 및 캐시 업데이트 완료");
      return response;
    } catch (error) {
      console.error("❌ 채널 멤버 차단 해제 실패:", error);
      throw error;
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && isChannelManageModal && (
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
                  <span className="mr-3 text-base">#</span>
                  채널 멤버 관리
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
                {/* 멤버 리스트 */}
                <div className="space-y-2">
                  {channelMemberList.data?.map((member) => (
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
                            {member.channelRole}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {member.cStatus !== "Banned" ? (
                          <>
                            <button
                              onClick={() =>
                                handleKickMember(member.userInfo.userEmail)
                              }
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              추방
                            </button>
                            <button
                              onClick={() =>
                                handleBanMember(member.userInfo.userEmail)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              차단
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              handleUnbanMember(member.userInfo.userEmail)
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
                    채널 멤버 관리
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
                        총 {channelMemberListData?.length || 0}명의 멤버가
                        있습니다
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
                  {channelMemberListData?.map((member) => (
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
                              member.cStatus === "Active"
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
                              {member.channelRole === "admin" && (
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
                                  member.cStatus === "Active"
                                    ? "bg-green-600/20 text-green-300"
                                    : "bg-red-600/20 text-red-300"
                                } ${isMobile ? "text-xs" : "text-xs"}`}
                              >
                                <span
                                  className={`rounded-full mr-1 ${
                                    member.cStatus === "Active"
                                      ? "bg-green-400"
                                      : "bg-red-400"
                                  } ${isMobile ? "w-1.5 h-1.5" : "w-2 h-2"}`}
                                ></span>
                                {member.cStatus === "Active"
                                  ? "활성"
                                  : "차단됨"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 액션 버튼들 */}
                        <div
                          className={`flex ${
                            isMobile ? "w-full space-x-1" : "ml-3 space-x-2"
                          }`}
                        >
                          {member.cStatus === "Active" ? (
                            <>
                              <button
                                onClick={() =>
                                  kickMember(member.userInfo.userEmail)
                                }
                                className={`bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded transition-colors ${
                                  isMobile
                                    ? "flex-1 px-1 py-1 text-xs"
                                    : "px-2 py-1 text-sm"
                                }`}
                              >
                                추방
                              </button>
                              <button
                                onClick={() =>
                                  banMember(member.userInfo.userEmail)
                                }
                                className={`bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors ${
                                  isMobile
                                    ? "flex-1 px-1 py-1 text-xs"
                                    : "px-2 py-1 text-sm"
                                }`}
                              >
                                차단
                              </button>
                            </>
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
                {(!channelMemberListData ||
                  channelMemberListData.length === 0) && (
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
                      채널에 멤버를 초대해보세요.
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
