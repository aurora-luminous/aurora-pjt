"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal, ChannelData } from "../hooks/useModal";
import {
  useCreateChannelMutation,
  useInvitePrivateChannelMutation,
  useProjectMemberListQuery,
} from "../hooks/useServerMutation";
import { useRouter } from "next/navigation";
import { useChannels } from "@/app/(servers)/hooks/useChannels";
import { createChannelUrl } from "../utils/serverAccessUtils";
import { Channel } from "../types/Channel";

const AddChannelModal = () => {
  const { isOpen, isChannelAddModal, close, data } = useModal();
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
  const [channelKind, setChannelKind] = useState<"text" | "voice" | "notice">(
    "text"
  );
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
    if (newSelectedMembers.has(userEmail)) {
      newSelectedMembers.delete(userEmail);
    } else {
      newSelectedMembers.add(userEmail);
    }
    setSelectedMembers(newSelectedMembers);
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === projectMemberList.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(
        new Set(projectMemberList.map((member) => member.userInfo.userEmail))
      );
    }
  };

  const channelData = data as ChannelData;

  // 2단계: 채널 생성 완료 후 멤버 초대 및 후속 처리
  useEffect(() => {
    if (!createdChannel || !channelData) return;

    const handleAfterChannelCreated = async () => {
      try {
        // 비공개 채널이고 선택된 멤버가 있으면 초대
        if (isPrivate && selectedMembers.size > 0) {
          try {
            const userEmails = Array.from(selectedMembers);
            await invitePrivateChannelMutation.mutateAsync(userEmails);
            console.log(
              `✅ ${selectedMembers.size}명의 멤버를 채널에 초대했습니다.`
            );
          } catch (error) {
            console.error("❌ 채널 초대 실패:", error);
            // 채널은 생성되었지만 초대에 실패한 경우에도 계속 진행
          }
        }

        // Redux에 채널 추가
        addChannelToState(createdChannel);

        // 성공 시 모달 닫기
        handleClose();

        // 새 채널로 이동
        const targetUrl = createChannelUrl(
          channelData.serverUrl,
          channelData.projectPk,
          createdChannel.channelName,
          createdChannel.channelKind
        );

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
        channelKind,
        isPrivate,
        channelPk: channelData.channelPk,
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

  const handleClose = () => {
    setChannelName("");
    setChannelKind("text");
    setIsPrivate(false);
    setSelectedMembers(new Set());
    setCreatedChannel(null);
    close();
  };

  const getChannelTypeDescription = (type: "text" | "voice" | "notice") => {
    switch (type) {
      case "text":
        return "메시지, 이미지, GIF, 이모지, 의견을 전송하세요.";
      case "voice":
        return "음성, 영상, 화면 공유를 함께 하세요.";
      case "notice":
        return "채널 공지사항이 올라오는 전용 채널입니다.";
    }
  };

  const getChannelIcon = (type: "text" | "voice" | "notice") => {
    switch (type) {
      case "text":
        return "#";
      case "voice":
        return "🔊";
      case "notice":
        return "📢";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && isChannelAddModal && (
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
              <h2 className="text-xl font-semibold text-white">채널 만들기</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 채널 유형 선택 */}
              <div>
                <h3 className="text-white text-sm font-medium mb-3">
                  채널 유형
                </h3>
                <div className="space-y-2">
                  {[
                    { type: "notice" as const, label: "공지" },
                    { type: "text" as const, label: "채팅" },
                    { type: "voice" as const, label: "음성" },
                  ].map(({ type, label }) => (
                    <label
                      key={type}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
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
                            e.target.value as "text" | "voice" | "notice"
                          )
                        }
                        className="sr-only"
                      />
                      <div className="flex items-center w-full">
                        <span className="mr-3 text-lg">
                          {getChannelIcon(type)}
                        </span>
                        <div className="flex-1">
                          <div className="text-white font-medium">{label}</div>
                          <div className="text-gray-300 text-sm">
                            {getChannelTypeDescription(type)}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            channelKind === type
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-400"
                          }`}
                        >
                          {channelKind === type && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 채널 이름 */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  채널 이름
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
              <div className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div className="flex items-center">
                  <span className="mr-3 text-lg">🔒</span>
                  <div>
                    <div className="text-white font-medium">비공개 채널</div>
                    <div className="text-gray-300 text-sm">
                      일부 사람들만 이 채널을 볼 수 있어요
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="sr-only peer"
                    disabled={createChannelMutation.isPending}
                  />
                  <div className="w-11 h-6 bg-gray-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {/* 비공개 채널 멤버 초대 */}
              {isPrivate && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white text-sm font-medium mb-2">
                      채널에 초대할 멤버 선택
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      이 비공개 채널에 접근할 수 있는 멤버를 선택하세요.
                    </p>
                  </div>

                  {/* 전체 선택 */}
                  <div className="flex items-center justify-between p-2 bg-gray-600 rounded">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          selectedMembers.size === projectMemberList.length &&
                          projectMemberList.length > 0
                        }
                        onChange={handleSelectAll}
                        className="mr-2 rounded border-gray-500 bg-gray-700"
                      />
                      <span className="text-white text-sm">전체 선택</span>
                    </label>
                    <span className="text-gray-400 text-sm">
                      {selectedMembers.size}명 선택됨
                    </span>
                  </div>

                  {/* 멤버 목록 */}
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {projectMemberListQuery.isLoading ? (
                      <div className="text-center py-4">
                        <div className="text-gray-400 text-sm">
                          멤버 목록을 불러오는 중...
                        </div>
                      </div>
                    ) : projectMemberList.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-gray-400 text-sm">
                          프로젝트 멤버가 없습니다.
                        </div>
                      </div>
                    ) : (
                      projectMemberList.map((member) => (
                        <div
                          key={member.userInfo.userEmail}
                          onClick={() =>
                            handleMemberSelect(member.userInfo.userEmail)
                          }
                          className="flex items-center p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(
                              member.userInfo.userEmail
                            )}
                            onChange={() => {}} // onClick에서 처리
                            className="mr-3 rounded border-gray-500 bg-gray-700"
                          />
                          <div className="flex items-center flex-1">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                              {member.userInfo.ProfileImageUrl ? (
                                <img
                                  src={member.userInfo.ProfileImageUrl}
                                  alt={member.userInfo.userName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-xs font-semibold">
                                  {member.userInfo.userName
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-white text-sm font-medium">
                                {member.userInfo.userName}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {member.userInfo.userEmail}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-white hover:underline transition-colors"
                  disabled={createChannelMutation.isPending}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    !channelName.trim() || createChannelMutation.isPending
                  }
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {createChannelMutation.isPending
                    ? "생성 중..."
                    : "채널 만들기"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddChannelModal;
