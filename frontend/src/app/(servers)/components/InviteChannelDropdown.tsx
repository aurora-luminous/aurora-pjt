"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useCreateInviteCodeMutation } from "@/app/(server-setup)/hooks/useServerMutation";

interface InviteChannelDropdownProps {
    serverUrl: string;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
}

export const InviteChannelDropDown: React.FC<InviteChannelDropdownProps> = ({ onClose, serverUrl, triggerRef }) => {
    const inviteCodeMutation = useCreateInviteCodeMutation(serverUrl);
    const [email, setEmail] = useState("");
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inviteCodeMutation.mutate();
    }, []);

    // Calculate position
    useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position to the right of the button with some margin
            setPosition({
                top: rect.top, // Align top
                left: rect.right + 10 // 10px margin
            });
        }
    }, [triggerRef]);

    const handleCopy = () => {
        if (inviteCodeMutation.data?.inviteLink) {
            navigator.clipboard.writeText(inviteCodeMutation.data.inviteLink);
        }
    };

    const getInviteLinkStatus = () => {
        if (inviteCodeMutation.isPending) return "링크 생성 중...";
        if (inviteCodeMutation.isError) return "권한이 없습니다 (관리자 문의)";
        return inviteCodeMutation.data?.inviteLink || "링크를 불러올 수 없습니다";
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="invite-channel-dropdown fixed w-72 bg-gray-700 rounded-lg shadow-xl z-[9999] border border-gray-600 p-4"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="mb-4">
                <p className="text-gray-200 text-xs font-medium mb-2">이메일로 초대하기</p>
                <div className="flex items-center gap-2">
                    <input 
                        className="flex-1 bg-gray-200 text-gray-900 border-none rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" 
                        type="email" 
                        placeholder="이메일을 입력해주세요" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3.5 py-1.5 rounded font-medium whitespace-nowrap transition-colors">
                        초대
                    </button>
                </div>
            </div>
            <div>
                <p className="text-gray-200 text-xs font-medium mb-2">공유링크 복사하기</p>
                <div className="flex items-center gap-2">
                    <input 
                        className={`flex-1 bg-gray-200 text-gray-900 border-none rounded px-3 py-1.5 text-sm outline-none cursor-default ${
                            inviteCodeMutation.isError ? "text-red-500" : ""
                        }`}
                        type="text" 
                        readOnly 
                        value={getInviteLinkStatus()}
                    />
                    <button 
                        onClick={handleCopy}
                        disabled={!inviteCodeMutation.data?.inviteLink}
                        className={`text-white text-sm px-3.5 py-1.5 rounded font-medium whitespace-nowrap transition-colors ${
                            !inviteCodeMutation.data?.inviteLink 
                                ? "bg-gray-500 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-500"
                        }`}
                    >
                        복사
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;

    return createPortal(dropdownContent, document.body);
};