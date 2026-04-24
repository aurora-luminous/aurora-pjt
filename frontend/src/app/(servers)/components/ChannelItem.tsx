"use client";

import React from "react";
import Link from "next/link";
import type { Channel } from "@/app/(server-setup)/types";
import { ChannelDropdownMenu } from "./ChannelDropdownMenu";
import { useUpdateLastChannelMutation } from "@/app/(server-setup)/hooks/useServerMutation";
import { InviteChannelDropDown } from "./InviteChannelDropdown";
import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";


interface ChannelItemProps {
  channel: Channel;
  isCurrentChannel: boolean;
  serverUrl: string;
  createChannelLink: (channel: Channel) => string;
  onContextMenu: (e: React.MouseEvent, channelName: string) => void;
  projectPk: number;
  showDropdown: boolean;
  showInviteDropdown: boolean;
  currentProjectRole: string | undefined;
  onDropdownClose: () => void;
  onChannelManage: (channel: Channel) => void;
  onChannelInviteDropdown: (e: React.MouseEvent, targetId: string) => void;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  serverUrl,
  isCurrentChannel,
  createChannelLink,
  onContextMenu,
  showDropdown,
  projectPk,
  showInviteDropdown,
  currentProjectRole,
  onDropdownClose,
  onChannelManage,
  onChannelInviteDropdown,
}) => {
  const updateLastChannelMutation = useUpdateLastChannelMutation();

  const getChannelIcon = () => {
    switch (channel.channelKind) {
      case "notification":
        return "📢";
      case "voice":
        return "🔊";
      default:
        return "#";
    }
  };
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleChannelClick = () => {
    // 채널 클릭 시 마지막 채널 정보 업데이트
    updateLastChannelMutation.mutate(channel.channelPk);
  };

  return (
    <div className="relative mb-1">
      <div
        className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
          isCurrentChannel
            ? "bg-gray-600 text-white"
            : "text-gray-300 hover:bg-gray-600 hover:text-white"
        }`}
        onContextMenu={(e) => onContextMenu(e, channel.channelName)}
      >
        <Link
          href={createChannelLink(channel)}
          className="flex items-center flex-1 overflow-hidden"
        >
          <span className="mr-2 text-gray-400">{getChannelIcon()}</span>
          <span className="truncate text-sm">{channel.channelName}</span>
          {channel.accessType === "private" && <span className="ml-auto text-xs">🔒</span>}
        </Link>
        <button 
          ref={buttonRef}
          className="invite-button ml-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all text-lg leading-none"
          onClick={(e) => {
            e.stopPropagation();
            onChannelInviteDropdown(e, channel.channelName);
          }}
        >
          +
        </button>
      </div>
      

       <ChannelDropdownMenu
        channel={channel}
        isVisible={showDropdown}
        currentProjectRole={currentProjectRole}
        serverUrl={serverUrl}
        projectPk={projectPk}
        onClose={onDropdownClose}
        onChannelManage={() => onChannelManage(channel)}
        
      />
      {showInviteDropdown && (
        <InviteChannelDropDown
          serverUrl={serverUrl}
          projectPk={projectPk}
          channelPk={channel.channelPk}
          onClose={() => onChannelInviteDropdown({} as React.MouseEvent, channel.channelName)}
          triggerRef={buttonRef}
        />
      )}
    </div>
  );
};
