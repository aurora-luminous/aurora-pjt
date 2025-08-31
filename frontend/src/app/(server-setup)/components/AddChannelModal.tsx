"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal, ChannelData } from "../hooks/useModal";
import { useCreateChannelMutation } from "../hooks/useServerMutation";
import { useRouter } from "next/navigation";
import { useChannels } from "@/app/(servers)/hooks/useChannels";
import { createChannelUrl } from "../utils/serverAccessUtils";

const AddChannelModal = () => {
  const { isOpen, isChannelAddModal, close, data } = useModal();
  const createChannelMutation = useCreateChannelMutation(
    (data as ChannelData)?.serverUrl || "",
    (data as ChannelData)?.projectPk || 0
  );
  const router = useRouter();
  const { addChannelToState } = useChannels(); // Redux 상태 업데이트용

  const [channelName, setChannelName] = useState("");
  const [channelKind, setChannelKind] = useState<"text" | "voice" | "notice">(
    "text"
  );
  const [isPrivate, setIsPrivate] = useState(false);

  const channelData = data as ChannelData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!channelData) return;

    try {
      const newChannelData = {
        channelName,
        channelKind,
        isPrivate,
        channelRole: "member",
      };

      console.log("🚀 채널 생성 시작:", newChannelData);

      const newChannel = await createChannelMutation.mutateAsync(
        newChannelData
      );

      if (!newChannel) {
        throw new Error("채널 생성에 실패했습니다.");
      }

      console.log("✅ 서버에서 채널 생성 성공:", newChannel);

      // Redux에 채널 추가
      addChannelToState(newChannel);

      // 성공 시 모달 닫기
      handleClose();

      // 새 채널로 이동 - 유틸 함수 사용
      const targetUrl = createChannelUrl(
        channelData.serverUrl,
        channelData.projectPk,
        newChannel.channelName,
        newChannel.channelKind
      );

      router.push(targetUrl);
    } catch (error) {
      console.error("❌ 채널 생성 실패:", error);
    }
  };

  const handleClose = () => {
    setChannelName("");
    setChannelKind("text");
    setIsPrivate(false);
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
