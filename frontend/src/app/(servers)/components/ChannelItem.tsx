import React from "react";
import Link from "next/link";
import { Channel } from "@/app/(server-setup)/types/Channel";
// import { ChannelDropdownMenu } from "./ChannelDropdownMenu";
import { InviteChannelDropDown } from "./InviteChannelDropdown";

interface ChannelItemProps {
  channel: Channel;
  isCurrentChannel: boolean;
  serverUrl: string;
  createChannelLink: (channel: Channel) => string;
  onContextMenu: (e: React.MouseEvent, channelName: string) => void;
  showDropdown: boolean;
  showInviteDropdown: boolean;
  currentProjectRole: string | undefined;
  onDropdownClose: () => void;
  onChannelManage: () => void;
  onChannelInviteDropdown: (e: React.MouseEvent, serverUrl: string) => void;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  serverUrl,
  isCurrentChannel,
  createChannelLink,
  onContextMenu,
  showDropdown,
  showInviteDropdown,
  currentProjectRole,
  onDropdownClose,
  onChannelManage,
  onChannelInviteDropdown,
}) => {
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

  const buttonRef = React.useRef<HTMLButtonElement>(null);

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
          {channel.isPrivate && <span className="ml-auto text-xs">🔒</span>}
        </Link>
        <button 
          ref={buttonRef}
          className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all text-lg leading-none"
          onClick={(e) => onChannelInviteDropdown(e, channel.channelName)}
        >
          +
        </button>
      </div>
      

      {/* <ChannelDropdownMenu
        channel={channel}
        isVisible={showDropdown}
        currentProjectRole={currentProjectRole}
        onClose={onDropdownClose}
        onChannelManage={onChannelManage}
      /> */}
      {showInviteDropdown && (
        <InviteChannelDropDown
          serverUrl={serverUrl}
          onClose={() => onChannelInviteDropdown({} as React.MouseEvent, channel.channelName)}
          triggerRef={buttonRef}
        />
      )}
    </div>
  );
};
