import React from "react";
import Image from "next/image";
import { useCurrentServerInfo } from "@/app/(server-setup)/hooks/useServer";

interface ServerHeaderProps {
  serverId: string;
  channelId?: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const ServerHeader: React.FC<ServerHeaderProps> = ({
  channelId,
  toggleSidebar,
  isSidebarOpen,
}) => {
  const serverInfo = useCurrentServerInfo();

  // 서버 정보 로딩 중일 때 기본값 사용
  const serverName = serverInfo?.serverName || "서버";
  const channelName = serverInfo?.channelName || "채널";

  return (
    <div className="h-12 bg-aurora-main flex items-center justify-between px-4">
      {/* 왼쪽: 로고 */}
      <div className="flex items-center min-w-0 flex-1">
        <Image
          src="/background/logo.png"
          alt="Aurora Logo"
          className="h-8 w-auto"
          width={120}
          height={32}
        />
      </div>

      {/* 중간: 서버명 또는 채널명 */}
      <div className="flex items-center justify-center flex-1">
        {channelId ? (
          <span className="text-white text-xl font-semibold flex items-center">
            <span className="text-gray-300 mr-2">#</span>
            {serverName}
          </span>
        ) : (
          <span className="text-white text-xl font-semibold flex items-center">
            {serverName}
            <svg
              className="w-4 h-4 text-white ml-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>

      {/* 오른쪽: 검색창과 토글 버튼 */}
      <div className="flex items-center justify-end flex-1 space-x-3">
        <input
          type="text"
          placeholder="검색하기"
          className="bg-white text-gray-500 placeholder-gray-500 px-3 py-1 rounded text-sm w-48 focus:outline-none focus:bg-blue-400"
        />
        {/* 사이드바 토글 버튼 */}
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-blue-500 p-2 rounded transition-colors"
          title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 보이기"}
        >
          {isSidebarOpen ? "»" : "«"}
        </button>
      </div>
    </div>
  );
};
