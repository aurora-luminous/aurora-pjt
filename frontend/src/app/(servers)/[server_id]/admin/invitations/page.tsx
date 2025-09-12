"use client";

import React, { useState, useEffect } from "react";
import { useCreateInviteCodeMutation } from "@/app/(server-setup)/hooks/useServerMutation";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";
import { useResponsive } from "../../../../lib/useResponsive";

const InvitationsPage = () => {
  const { isMobile } = useResponsive();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);

  const serverUrl = useCurrentServerInfo()?.serverUrl;
  const createInviteCodeMutation = useCreateInviteCodeMutation(serverUrl || "");

  useEffect(() => {
    const generateInviteLink = async () => {
      try {
        const result = await createInviteCodeMutation.mutateAsync();
        console.log("생성된 초대 링크:", result);
        if (result) {
          const link = String(result.inviteLink);
          localStorage.setItem("inviteLink", link);
          setInviteLink(link);
        }
      } catch (error) {
        console.error("초대 링크 생성 실패:", error);
      } finally {
        setIsLoading(false);
        setHasGenerated(true);
      }
    };

    // serverUrl이 있고 아직 생성하지 않았을 때만 API 호출
    if (serverUrl && !hasGenerated) {
      generateInviteLink();
    } else if (!serverUrl) {
      setIsLoading(false);
    }
  }, [serverUrl]); // serverUrl이 준비되면 한 번만 실행

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("초대 링크가 클립보드에 복사되었습니다!");
    } catch (error) {
      alert("초대 링크 복사에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div
        className={`
        flex-1 bg-gray-900
        ${isMobile ? "p-4" : "p-6"}
      `}
      >
        <div className="flex items-center justify-center h-64">
          <div
            className={`
            text-gray-400
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            초대 링크를 생성하는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      flex-1
      ${isMobile ? "p-4" : "p-6"}
    `}
    >
      {/* 헤더 */}
      <div className="mb-6">
        <h1
          className={`
          font-bold text-white mb-2
          ${isMobile ? "text-xl" : "text-2xl"}
        `}
        >
          초대 링크
        </h1>
        <p
          className={`
          text-gray-400
          ${isMobile ? "text-sm" : "text-base"}
        `}
        >
          아래 링크를 공유하여 새로운 멤버를 서버에 초대하세요.
        </p>
      </div>

      {/* 초대 링크 카드 */}
      {inviteLink && (
        <div
          className={`
          bg-gray-800 rounded-lg border border-gray-700
          ${isMobile ? "p-4" : "p-6"}
        `}
        >
          <div className="mb-4">
            <h3
              className={`
              font-medium text-white mb-2
              ${isMobile ? "text-base" : "text-lg"}
            `}
            >
              서버 초대 링크
            </h3>
            <p
              className={`
              text-gray-400
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              이 링크를 사용하여 다른 사람들을 서버에 초대할 수 있습니다.
            </p>
          </div>

          <div
            className={`
            flex items-center
            ${isMobile ? "flex-col space-y-3 space-x-0" : "space-x-3 space-y-0"}
          `}
          >
            <code
              className={`
              bg-gray-700 rounded text-gray-300 truncate
              ${
                isMobile
                  ? "px-3 py-2 text-xs w-full"
                  : "px-4 py-3 text-sm flex-1"
              }
            `}
            >
              {inviteLink}
            </code>
            <button
              onClick={handleCopyInvite}
              className={`
                bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors
                ${isMobile ? "px-4 py-2 text-sm w-full" : "px-4 py-3 text-base"}
              `}
            >
              복사
            </button>
          </div>
        </div>
      )}

      {!inviteLink && !isLoading && (
        <div
          className={`
          text-center
          ${isMobile ? "py-8" : "py-12"}
        `}
        >
          <div
            className={`
            text-red-400
            ${isMobile ? "text-sm" : "text-base"}
          `}
          >
            초대 링크 생성에 실패했습니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationsPage;
