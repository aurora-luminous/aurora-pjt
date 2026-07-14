"use client";

import React from "react";
import type { Channel } from "@/app/(server-setup)/types";
import { ChannelKind, AccessType, ChannelRole } from "@/app/(server-setup)/types";
import { useChannelFlow } from "@/app/(server-setup)/hooks/useChannelFlow";
import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";

interface ChannelDropdownMenuProps {
  channel: Channel;
  isVisible: boolean;
  currentProjectRole: string | undefined;
  serverUrl: string;
  projectPk: number;
  onClose: () => void;
  onChannelManage: () => void;
  
}

export const ChannelDropdownMenu: React.FC<ChannelDropdownMenuProps> = ({
  channel,
  isVisible,
  currentProjectRole,
  serverUrl,
  projectPk,
  onClose,
  onChannelManage,
 
}) => {
  const userEmail = useGetUserInfoQuery().data?.userEmail;
  const { handleLeaveChannel } = useChannelFlow(serverUrl, projectPk, channel.channelPk);

  if (!isVisible) return null;

  const handleChannelInfo = () => {
    onClose();
    console.log(`채널 정보: ${channel.channelName}`);
  };

  const handleLeaveChannelClick = () => {
    if (userEmail) {
        handleLeaveChannel(userEmail);
    }
    onClose();
    console.log(`채널에서 나가기: ${channel.channelName}`);
  };

  const handleJoinVoiceChannel = () => {
    onClose();
    console.log(`음성 채널 참가: ${channel.channelName}`);
  };

  const handleNotificationSettings = () => {
    onClose();
    console.log(`알림 설정: ${channel.channelName}`);
  };

  const handleChannelManage = () => {
    onClose();
    onChannelManage();
  };

  // 채널 관리 권한 확인
  // 비공개 채널: 채널 역할이 ADMIN이어야 함
  // 공개 채널: 프로젝트 역할이 admin이어야 함
  const canManageChannel =
    channel.accessType === AccessType.PRIVATE
      ? channel.channelRole === ChannelRole.ADMIN
      : currentProjectRole === "admin";

  return (
    <div
      className="absolute top-full left-0 mt-1 w-48 bg-gray-700 rounded shadow-lg z-[9999] border border-gray-600"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 음성 채널 참가 (음성 채널 전용) */}
      {channel.channelKind === ChannelKind.VOICE && (
        <button
          onClick={handleJoinVoiceChannel}
          className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
        >
          <div className="flex items-center">
            <span className="mr-3">🎙️</span>
            <div>
              <div className="font-medium">음성 채널 참가</div>
              <div className="text-xs text-gray-400">음성 채팅에 참여하기</div>
            </div>
          </div>
        </button>
      )}

      {/* 채널 정보 */}
      <button
        onClick={handleChannelInfo}
        className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
      >
        <div className="flex items-center">
          <span className="mr-3">ℹ️</span>
          <div>
            <div className="font-medium">채널 정보</div>
            <div className="text-xs text-gray-400">채널 세부사항 보기</div>
          </div>
        </div>
      </button>

      {/* 채널에서 나가기 (비공개 채널 전용) */}
      {channel.accessType === AccessType.PRIVATE && (
        <button
          onClick={handleLeaveChannelClick}
          className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
        >
          <div className="flex items-center">
            <span className="mr-3">🚪</span>
            <div>
              <div className="font-medium">채널에서 나가기</div>
              <div className="text-xs text-gray-400">이 채널을 떠나기</div>
            </div>
          </div>
        </button>
      )}

      {/* 채널 관리 (권한이 있는 경우만 표시) */}
      {canManageChannel && (
        <button
          onClick={handleChannelManage}
          className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors border-b border-gray-600"
        >
          <div className="flex items-center">
            <span className="mr-3">⚙️</span>
            <div>
              <div className="font-medium">채널 관리</div>
              <div className="text-xs text-gray-400">채널 설정 변경</div>
            </div>
          </div>
        </button>
      )}

      {/* 알림 설정 */}
      <button
        onClick={handleNotificationSettings}
        className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors rounded-b"
      >
        <div className="flex items-center">
          <span className="mr-3">🔔</span>
          <div>
            <div className="font-medium">알림 설정</div>
            <div className="text-xs text-gray-400">채널 알림 관리</div>
          </div>
        </div>
      </button>
    </div>
  );
};
