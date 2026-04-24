"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useInvitePrivateChannelMutation,
  useMemberSearchQuery,
} from "@/app/(server-setup)/hooks/useServerMutation";
import { useDebounce } from "@/app/(server-setup)/hooks/useDebounce";
import type { UserInfo } from "@/app/(server-setup)/types";

interface InviteChannelDropdownProps {
  serverUrl: string;
  projectPk: number;
  channelPk: number;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export const InviteChannelDropDown: React.FC<InviteChannelDropdownProps> = ({
  serverUrl,
  projectPk,
  channelPk,
  triggerRef,
}) => {
  const invitePrivateChannelMutation = useInvitePrivateChannelMutation(
    serverUrl,
    projectPk,
    channelPk,
  );
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedEmail = useDebounce(email.trim(), 300);
  const memberSearchQuery = useMemberSearchQuery(
    { searchString: debouncedEmail },
    serverUrl,
    projectPk,
  );
  const searchedMembers = memberSearchQuery.data ?? [];
  const isSearching = debouncedEmail.length > 0;

  // Calculate position
  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position to the right of the button with some margin
      setPosition({
        top: rect.top, // Align top
        left: rect.right + 10, // 10px margin
      });
    }
  }, [triggerRef]);

  const handleInvite = async (userEmail: string) => {
    if (!userEmail) return;

    await invitePrivateChannelMutation.mutateAsync([userEmail]);
    setEmail("");
  };

  const getMemberInitial = (member: UserInfo) => {
    return (member.userName || member.userEmail || "?")
      .charAt(0)
      .toUpperCase();
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="invite-channel-dropdown fixed w-80 bg-gray-700 rounded-lg shadow-xl z-9999 border border-gray-600 p-4"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <p className="text-gray-200 text-xs font-medium mb-2">
          이메일로 초대하기
        </p>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 bg-gray-200 text-gray-900 border-none rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            type="email"
            placeholder="이메일을 입력해주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {isSearching && (
          <div className="mt-3 rounded-lg border border-gray-600 bg-gray-800/80 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600 bg-gray-800">
              <p className="text-[11px] font-medium tracking-wide text-gray-300">
                검색된 멤버
              </p>
              <span className="text-[11px] text-gray-400">
                {memberSearchQuery.isFetching
                  ? "검색 중"
                  : `${searchedMembers.length}명`}
              </span>
            </div>

            {memberSearchQuery.isFetching ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                멤버 검색 중...
              </div>
            ) : memberSearchQuery.isError || searchedMembers.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                검색 결과가 없습니다
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                {searchedMembers.map((member) => (
                  <div
                    key={member.userEmail}
                    className="flex items-center gap-3 rounded-lg border border-gray-600 bg-gray-700/70 px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-600/90 text-sm font-semibold text-white">
                      {member.ProfileImageUrl ? (
                        <img
                          src={member.ProfileImageUrl}
                          alt={member.userName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getMemberInitial(member)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {member.userName || "이름 없음"}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {member.userEmail}
                      </p>
                    </div>
                    <button
                      onClick={() => handleInvite(member.userEmail)}
                      disabled={invitePrivateChannelMutation.isPending}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500"
                    >
                      {invitePrivateChannelMutation.isPending
                        ? "초대 중"
                        : "초대"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(dropdownContent, document.body);
};
