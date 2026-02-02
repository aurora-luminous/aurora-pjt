import React from "react";
import { Channel } from "@/app/(server-setup)/types/Channel";
import { ChannelItem } from "./ChannelItem";

interface ChannelSectionProps {
  title: string;
  serverUrl: string;
  channels: Channel[];
  isCurrentChannel: (channelName: string) => boolean;
  createChannelLink: (channel: Channel) => string;
  onChannelContextMenu: (e: React.MouseEvent, channelName: string) => void;
  onChannelInviteDropdown: (e: React.MouseEvent, serverUrl: string) => void;
  showChannelOptionMenu: string | null;
  showInviteDropdown: string | null;
  currentProjectRole: string | undefined;
  onChannelDropdownClose: () => void;
  onChannelManage: () => void;
  emptyMessage?: string;
}

export const ChannelSection: React.FC<ChannelSectionProps> = ({
  title,
  serverUrl,
  channels,
  isCurrentChannel,
  createChannelLink,
  onChannelContextMenu,
  onChannelInviteDropdown,
  showChannelOptionMenu,
  showInviteDropdown,
  currentProjectRole,
  onChannelDropdownClose,
  onChannelManage,
  emptyMessage = "채널이 없습니다",
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-300 text-xs font-semibold uppercase">
          {title}
        </h3>
        <button className="text-gray-400 hover:text-gray-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {channels.length === 0 ? (
        <div className="text-gray-400 text-sm py-2">{emptyMessage}</div>
      ) : (
        channels.map((channel: Channel) => (
          <ChannelItem
            key={channel.channelName}
            channel={channel}
            serverUrl={serverUrl}
            isCurrentChannel={isCurrentChannel(channel.channelName)}
            createChannelLink={createChannelLink}
            onContextMenu={onChannelContextMenu}
            showDropdown={showChannelOptionMenu === channel.channelName}
            showInviteDropdown={showInviteDropdown === channel.channelName}
            currentProjectRole={currentProjectRole}
            onDropdownClose={onChannelDropdownClose}
            onChannelManage={onChannelManage}
            onChannelInviteDropdown={onChannelInviteDropdown}
          />
        ))
      )}
    </div>
  );
};
