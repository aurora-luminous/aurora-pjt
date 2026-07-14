"use client";

import React from "react";
import type { Channel } from "@/app/(server-setup)/types";
import { ChannelItem } from "./ChannelItem";

interface ChannelSectionProps {
  title: string;
  channels: Channel[];
  serverUrl: string;
  serverId: string;
  projectPk: number;
  isCurrentChannel: (channel: Channel) => boolean;
  createChannelLink: (channel: Channel) => string;
  onChannelContextMenu: (e: React.MouseEvent, channelName: string) => void;
  showChannelOptionMenu: string | null;
  showInviteDropdown: string | null;
  currentProjectRole: string | undefined;
  onChannelDropdownClose: () => void;
  onChannelManage: (channel: Channel) => void;
  onChannelInviteDropdown: (e: React.MouseEvent, targetId: string) => void;
  emptyMessage?: string;
}

export const ChannelSection: React.FC<ChannelSectionProps> = ({
  title,
  channels,
  serverUrl,
  serverId,
  projectPk,
  isCurrentChannel,
  createChannelLink,
  onChannelContextMenu,
  showChannelOptionMenu,
  showInviteDropdown,
  currentProjectRole,
  onChannelDropdownClose,
  onChannelManage,
  onChannelInviteDropdown,
  emptyMessage = "채널이 없습니다",
}) => {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          {title} ({channels.length})
        </h2>
      </div>

      <div className="space-y-0.5">
        {channels.length > 0 ? (
          channels.map((channel) => (
            <ChannelItem
              key={channel.channelPk}
              channel={channel}
              serverUrl={serverUrl}
              projectPk={projectPk}
              isCurrentChannel={isCurrentChannel(channel)}
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
        ) : (
          <p className="text-gray-500 text-xs py-2 px-2 italic">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
};
