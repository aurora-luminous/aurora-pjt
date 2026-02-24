import React from "react";
import Link from "next/link";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { ChannelDropdownMenu } from "./ChannelDropdownMenu";
import { useUpdateLastChannelMutation } from "@/app/(server-setup)/hooks/useServerMutation";

interface ChannelItemProps {
  channel: Channel;
  isCurrentChannel: boolean;
  createChannelLink: (channel: Channel) => string;
  onContextMenu: (e: React.MouseEvent, channelName: string) => void;
  showDropdown: boolean;
  currentProjectRole: string | undefined;
  onDropdownClose: () => void;
  onChannelManage: () => void;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isCurrentChannel,
  createChannelLink,
  onContextMenu,
  showDropdown,
  currentProjectRole,
  onDropdownClose,
  onChannelManage,
}) => {
  const updateLastChannelMutation = useUpdateLastChannelMutation();

  const getChannelIcon = () => {
    switch (channel.channelKind) {
      case "notice":
        return "📢";
      case "voice":
        return "🔊";
      default:
        return "#";
    }
  };

  const handleChannelClick = () => {
    // 채널 클릭 시 마지막 채널 정보 업데이트
    updateLastChannelMutation.mutate(channel.channelPk);
  };

  return (
    <div className="relative mb-1">
      <Link href={createChannelLink(channel)} onClick={handleChannelClick}>
        <div
          className={`flex items-center px-2 py-1 rounded cursor-pointer transition-colors ${
            isCurrentChannel
              ? "bg-gray-600 text-white"
              : "text-gray-300 hover:bg-gray-600 hover:text-white"
          }`}
          onContextMenu={(e) => onContextMenu(e, channel.channelName)}
        >
          <span className="mr-2 text-gray-400">{getChannelIcon()}</span>
          <span className="text-sm">{channel.channelName}</span>
          {channel.isPrivate && <span className="ml-auto text-xs">🔒</span>}
        </div>
      </Link>

      <ChannelDropdownMenu
        channel={channel}
        isVisible={showDropdown}
        currentProjectRole={currentProjectRole}
        onClose={onDropdownClose}
        onChannelManage={onChannelManage}
      />
    </div>
  );
};
