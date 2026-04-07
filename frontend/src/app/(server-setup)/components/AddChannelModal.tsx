"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useModal } from "../hooks/useModal";
import {
  useCreateChannelMutation,
  useInvitePrivateChannelMutation,
  useProjectMemberListQuery,
} from "../hooks/useServerMutation";
import { useRouter } from "next/navigation";
import { useChannels } from "@/app/(servers)/hooks/useChannels";
import { createChannelUrl } from "../utils/serverAccessUtils";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useResponsive } from "../../lib/useResponsive";
import type { ChannelData, Channel } from "../types";
import { ChannelKind, AccessType } from "../types";

const AddChannelModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isChannelAddModal, close, data } = useModal();
  const serverInfo = useCurrentServerInfo();
  const userRole = serverInfo?.role;

  const createChannelMutation = useCreateChannelMutation(
    (data as ChannelData)?.serverUrl || "",
    (data as ChannelData)?.projectPk || 0
  );
  const router = useRouter();
  const { addChannelToState } = useChannels(); // Redux 상태 업데이트용

  // 채널 생성 후 멤버 초대를 위한 state
  const [createdChannel, setCreatedChannel] = useState<Channel | null>(null);

  // 멤버 초대를 위한 mutation (채널이 생성된 후에만 활성화)
  const invitePrivateChannelMutation = useInvitePrivateChannelMutation(
    (data as ChannelData)?.serverUrl || "",
    (data as ChannelData)?.projectPk || 0,
    createdChannel?.channelPk || 0
  );

  const [channelName, setChannelName] = useState("");
  const [channelKind, setChannelKind] = useState<ChannelKind>(ChannelKind.TEXT);
  const [isPrivate, setIsPrivate] = useState(false);
  const projectMemberListQuery = useProjectMemberListQuery(
    (data as ChannelData)?.serverUrl || "",
    (data as ChannelData)?.projectPk || 0
  );
  const projectMemberList = projectMemberListQuery.data || [];
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );

  const handleMemberSelect = (userEmail: string) => {
    const newSelectedMembers = new Set(selectedMembers);
    if (selectedMembers.has(userEmail)) {
      newSelectedMembers.delete(userEmail);
    } else {
      newSelectedMembers.add(userEmail);
    }
    setSelectedMembers(newSelectedMembers);
  };

  const handleClose = () => {
    setChannelName("");
    setChannelKind(ChannelKind.TEXT);
    setIsPrivate(false);
    setSelectedMembers(new Set());
    setCreatedChannel(null);
    close();
  };

  const channelData = data as ChannelData;

  // 2단계: 채널 생성 완료 후 처리 (멤버 초대 + 라우팅)
  useEffect(() => {
    if (!createdChannel) return;

    const handleAfterChannelCreated = async () => {
      try {
        // 비공개 채널이고 선택된 멤버가 있으면 멤버 초대
        if (isPrivate && selectedMembers.size > 0) {
          console.log("🚀 비공개 채널 멤버 초대 시작:", {
            channelPk: createdChannel.channelPk,
            selectedMembers: Array.from(selectedMembers),
          });

          const userEmails = Array.from(selectedMembers);
          await invitePrivateChannelMutation.mutateAsync(userEmails);
          console.log("✅ 멤버 초대 성공");
        }

        // Redux에 채널 추가
        addChannelToState(createdChannel);

        // 성공 시 모달 닫기
        handleClose();

        // 새 채널로 이동 (공개/비공개 상관없이 모든 채널)
        const targetUrl = createChannelUrl(
          channelData.serverUrl,
          channelData.projectPk,
          createdChannel.channelPk,
          createdChannel.channelKind
        );

        console.log("🔄 채널로 라우팅:", targetUrl);
        router.push(targetUrl);
      } catch (error) {
        console.error("❌ 채널 후속 처리 실패:", error);
      }
    };

    handleAfterChannelCreated();
  }, [
    createdChannel,
    isPrivate,
    selectedMembers,
    channelData,
    invitePrivateChannelMutation,
    addChannelToState,
    router,
  ]);

  // 1단계: 채널 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!channelData) return;

    try {
      const newChannelData = {
        channelName,
        channelKind: channelKind,
        accessType: isPrivate ? AccessType.PRIVATE : AccessType.PUBLIC,
      };

      console.log("🚀 채널 생성 시작:", newChannelData);

      const newChannel = await createChannelMutation.mutateAsync(
        newChannelData
      );

      if (!newChannel) {
        throw new Error("채널 생성에 실패했습니다.");
      }

      console.log("✅ 서버에서 채널 생성 성공:", newChannel);

      // 생성된 채널을 state에 저장 (2단계 트리거)
      setCreatedChannel(newChannel);
    } catch (error) {
      console.error("❌ 채널 생성 실패:", error);
    }
  };

  const getChannelTypeDescription = (type: ChannelKind) => {
    switch (type) {
      case ChannelKind.TEXT:
        return "텍스트 메시지를 주고받을 수 있는 채널입니다.";
      case ChannelKind.VOICE:
        return "음성 통화를 할 수 있는 채널입니다.";
      case ChannelKind.NOTIFICATION:
        return "채널 공지사항이 올라오는 전용 채널입니다.";
    }
  };

  const getChannelIcon = (type: ChannelKind) => {
    switch (type) {
      case ChannelKind.TEXT:
        return "#";
      case ChannelKind.VOICE:
        return "🔊";
      case ChannelKind.NOTIFICATION:
        return "📢";
    }
  };

  // Validate permission and filtering channel types
  const channelTypes = [
    { type: ChannelKind.NOTIFICATION, label: "공지" },
    { type: ChannelKind.TEXT, label: "채팅" },
    { type: ChannelKind.VOICE, label: "음성" },
  ].filter((item) => {
    // If user is a member, they cannot create 'notice' channels
    if (userRole === "member" && item.type === ChannelKind.NOTIFICATION) {
      return false;
    }
    return true;
  });

  const modalContent = (
    <AnimatePresence>
      {isOpen && isChannelAddModal && (
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
              className="absolute inset-x-0 bottom-0 bg-gray-700 rounded-t-xl max-h-[65vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>

              {/* 헤더 */}
              <div className="flex justify-between items-center px-4 pb-4">
                <h2 className="text-lg font-semibold text-white">
                  채널 만들기
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 채널 유형 선택 */}
                  <div>
                    <h3 className="text-white font-medium mb-3 text-sm">
                      채널 유형
                    </h3>
                    
                    <div className="space-y-2">
                      {channelTypes.map(({ type, label }) => (
                        <label
                          key={type}
                          className={`flex items-center rounded-lg cursor-pointer transition-colors p-2 ${
                            channelKind === type
                              ? "bg-blue-600/20 border border-blue-600"
                              : "bg-gray-600 hover:bg-gray-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="channelKind"
                            value={type}
                            checked={channelKind === type}
                            onChange={(e) =>
                              setChannelKind(
                                e.target.value as ChannelKind
                              )
                            }
                            className="sr-only"
                            disabled={createChannelMutation.isPending}
                          />
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <span className="mr-3 text-base">
                                {getChannelIcon(type)}
                              </span>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {label}
                                </div>
                                <div className="text-gray-300 text-xs">
                                  {getChannelTypeDescription(type)}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`rounded-full border-2 w-3 h-3 ${
                                channelKind === type
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-400"
                              }`}
                            >
                              {channelKind === type && (
                                <div className="bg-white rounded-full w-1 h-1 m-1"></div>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 채널 이름 */}
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">
                      채널 이름
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        {getChannelIcon(channelKind)}
                      </span>
                      <input
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="새로운 채널"
                        className="w-full pl-8 pr-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={createChannelMutation.isPending}
                      />
                    </div>
                  </div>

                  {/* 비공개 채널 옵션 */}
                  <div className="flex items-center justify-between bg-gray-600 rounded-lg p-2">
                    <div className="flex items-center">
                      <span className="mr-3 text-base">🔒</span>
                      <div>
                        <div className="text-white font-medium text-sm">
                          비공개 채널
                        </div>
                        <div className="text-gray-300 text-xs">
                          일부 사람들만 이 채널을 볼 수 있어요
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`relative flex-shrink-0 rounded-full transition-colors w-10 h-6 ${
                        isPrivate ? "bg-blue-600" : "bg-gray-400"
                      }`}
                      disabled={createChannelMutation.isPending}
                    >
                      <span
                        className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                          isPrivate ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* 비공개 채널일 때 멤버 선택 */}
                  {isPrivate && (
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">
                        초대할 멤버 선택
                      </label>
                      <div className="bg-gray-600 rounded-lg p-2 max-h-32 overflow-y-auto">
                        {projectMemberList.length === 0 ? (
                          <div className="text-gray-400 text-center text-xs py-2">
                            프로젝트 멤버가 없습니다
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {projectMemberList.map((member) => (
                              <label
                                key={member.userInfo.userEmail}
                                className="flex items-center cursor-pointer p-1 rounded hover:bg-gray-500"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.has(
                                    member.userInfo.userEmail
                                  )}
                                  onChange={() =>
                                    handleMemberSelect(
                                      member.userInfo.userEmail
                                    )
                                  }
                                  className="mr-2 rounded w-3 h-3"
                                  disabled={createChannelMutation.isPending}
                                />
                                <div className="flex items-center">
                                  <div className="rounded-full bg-blue-500 flex items-center justify-center text-white font-bold w-6 h-6 text-xs mr-2">
                                    {member.userInfo.userEmail[0].toUpperCase()}
                                  </div>
                                  <span className="text-white text-xs">
                                    {member.userInfo.userEmail}
                                  </span>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 버튼 그룹 */}
                  <div className="flex space-x-2 pt-2 pb-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors py-2 text-sm"
                      disabled={createChannelMutation.isPending}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2 text-sm"
                      disabled={
                        createChannelMutation.isPending || !channelName.trim()
                      }
                    >
                      {createChannelMutation.isPending
                        ? "생성 중..."
                        : "채널 만들기"}
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
                  채널 만들기
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 채널 유형 선택 */}
                <div>
                  <h3 className="text-white font-medium mb-3 text-sm">
                    채널 유형
                  </h3>
                  <div className="space-y-2">
                    {channelTypes.map(({ type, label }) => (
                      <label
                        key={type}
                        className={`flex items-center rounded-lg cursor-pointer transition-colors p-3 ${
                          channelKind === type
                            ? "bg-blue-600/20 border border-blue-600"
                            : "bg-gray-600 hover:bg-gray-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="channelKind"
                          value={type}
                          checked={channelKind === type}
                          onChange={(e) =>
                            setChannelKind(
                              e.target.value as ChannelKind
                            )
                          }
                          className="sr-only"
                          disabled={createChannelMutation.isPending}
                        />
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <span className="mr-3 text-lg">
                              {getChannelIcon(type)}
                            </span>
                            <div>
                              <div className="text-white font-medium text-base">
                                {label}
                              </div>
                              <div className="text-gray-300 text-sm">
                                {getChannelTypeDescription(type)}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`rounded-full border-2 w-4 h-4 ${
                              channelKind === type
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-400"
                            }`}
                          >
                            {channelKind === type && (
                              <div className="bg-white rounded-full w-2 h-2 m-0.5"></div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 채널 이름 */}
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">
                    채널 이름
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base">
                      {getChannelIcon(channelKind)}
                    </span>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="새로운 채널"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={createChannelMutation.isPending}
                    />
                  </div>
                </div>

                {/* 비공개 채널 옵션 */}
                <div className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">🔒</span>
                    <div>
                      <div className="text-white font-medium text-base">
                        비공개 채널
                      </div>
                      <div className="text-gray-300 text-sm">
                        일부 사람들만 이 채널을 볼 수 있어요
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative flex-shrink-0 rounded-full transition-colors w-12 h-6 ${
                      isPrivate ? "bg-blue-600" : "bg-gray-400"
                    }`}
                    disabled={createChannelMutation.isPending}
                  >
                    <span
                      className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                        isPrivate ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* 비공개 채널일 때 멤버 선택 */}
                {isPrivate && (
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">
                      초대할 멤버 선택
                    </label>
                    <div className="bg-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {projectMemberList.length === 0 ? (
                        <div className="text-gray-400 text-center text-sm py-4">
                          프로젝트 멤버가 없습니다
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {projectMemberList.map((member) => (
                            <label
                              key={member.userInfo.userEmail}
                              className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-500"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMembers.has(
                                  member.userInfo.userEmail
                                )}
                                onChange={() =>
                                  handleMemberSelect(member.userInfo.userEmail)
                                }
                                className="mr-2 rounded w-4 h-4"
                                disabled={createChannelMutation.isPending}
                              />
                              <div className="flex items-center">
                                <div className="rounded-full bg-blue-500 flex items-center justify-center text-white font-bold w-8 h-8 text-sm mr-3">
                                  {member.userInfo.userEmail[0].toUpperCase()}
                                </div>
                                <span className="text-white text-sm">
                                  {member.userInfo.userEmail}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 버튼 그룹 */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors py-3"
                    disabled={createChannelMutation.isPending}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3"
                    disabled={
                      createChannelMutation.isPending || !channelName.trim()
                    }
                  >
                    {createChannelMutation.isPending
                      ? "생성 중..."
                      : "채널 만들기"}
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

export default AddChannelModal;
