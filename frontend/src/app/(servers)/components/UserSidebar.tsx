import React from "react";
import Link from "next/link";
import { User, DirectMessage, TabType } from "../types";

interface UserSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onlineUsers: User[];
  directMessages: DirectMessage[];
  serverId: string;
  projectId: string;
  isSidebarOpen: boolean;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  activeTab,
  setActiveTab,
  onlineUsers,
  directMessages,
  serverId,
  projectId,
  isSidebarOpen,
}) => {
  if (!isSidebarOpen) return null;

  return (
    <div className="w-64 bg-gray-600 flex flex-col rounded-tl-lg">
      {/* 탭 헤더 */}
      <div className="relative border-b border-gray-500">
        <div className="flex">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "favorites"
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            프로젝트 멤버
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "messages"
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            개인 메시지
          </button>
        </div>
        {/* 애니메이션 밑줄 */}
        <div
          className={`absolute bottom-0 h-0.5 bg-white transition-transform duration-300 ease-in-out ${
            activeTab === "favorites" ? "w-1/2" : "w-1/2 translate-x-full"
          }`}
        ></div>
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "favorites" ? (
          /* 프로젝트 멤버 탭 */
          <div className="space-y-4">
            {/* 온라인 사용자 섹션 */}
            <div>
              <h3 className="text-white text-sm font-medium mb-3">
                온라인 ———{" "}
                {onlineUsers.filter((u) => u.status === "online").length}
              </h3>
              <div className="space-y-2">
                {onlineUsers
                  .filter((user) => user.status === "online")
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center p-2 rounded hover:bg-gray-500 cursor-pointer"
                    >
                      <div className="relative mr-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <span className="text-gray-800 text-sm font-medium">
                            {user.name[0]}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-600"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">
                          {user.name}
                        </div>
                        <div className="text-gray-300 text-xs">
                          출근 아직 안합니다
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 자리비움 사용자 섹션 */}
            {onlineUsers.filter((u) => u.status === "away").length > 0 && (
              <div>
                <h3 className="text-white text-sm font-medium mb-3">
                  자리비움 ———{" "}
                  {onlineUsers.filter((u) => u.status === "away").length}
                </h3>
                <div className="space-y-2">
                  {onlineUsers
                    .filter((user) => user.status === "away")
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-2 rounded hover:bg-gray-500 cursor-pointer"
                      >
                        <div className="relative mr-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <span className="text-gray-800 text-sm font-medium">
                              {user.name[0]}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-600"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">
                            {user.name}
                          </div>
                          <div className="text-gray-300 text-xs">
                            출근 아직 안합니다
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 바쁨 사용자 섹션 */}
            {onlineUsers.filter((u) => u.status === "busy").length > 0 && (
              <div>
                <h3 className="text-white text-sm font-medium mb-3">
                  바쁨 ———{" "}
                  {onlineUsers.filter((u) => u.status === "busy").length}
                </h3>
                <div className="space-y-2">
                  {onlineUsers
                    .filter((user) => user.status === "busy")
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-2 rounded hover:bg-gray-500 cursor-pointer"
                      >
                        <div className="relative mr-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <span className="text-gray-800 text-sm font-medium">
                              {user.name[0]}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-gray-600"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">
                            {user.name}
                          </div>
                          <div className="text-gray-300 text-xs">
                            출근 아직 안합니다
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 오프라인 사용자 섹션 */}
            <div>
              <h3 className="text-white text-sm font-medium mb-3">
                오프라인 ——— 1
              </h3>
              <div className="space-y-2">
                <div className="flex items-center p-2 rounded hover:bg-gray-500 cursor-pointer">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-gray-800 text-sm font-medium">
                        심
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-gray-600"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">심근원</div>
                    <div className="text-gray-300 text-xs">
                      Figma 보고있는데 소용이...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 개인 메시지 탭 */
          <div className="space-y-2">
            {directMessages.map((dm) => (
              <Link
                key={dm.id}
                href={`/${serverId}/projects/${projectId}/messages/${dm.id}`}
                className="flex items-center p-2 rounded hover:bg-gray-500 cursor-pointer"
              >
                <div className="relative mr-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-gray-800 text-sm font-medium">
                      {dm.name[0]}
                    </span>
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-600 ${
                      dm.status === "online"
                        ? "bg-green-400"
                        : dm.status === "away"
                        ? "bg-yellow-400"
                        : dm.status === "busy"
                        ? "bg-red-400"
                        : "bg-gray-400"
                    }`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {dm.name}
                  </div>
                  {dm.lastMessage && (
                    <div className="text-gray-300 text-xs truncate">
                      {dm.lastMessage}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
