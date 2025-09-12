import React from "react";
import Link from "next/link";
import { DirectMessage, TabType } from "../types";
import { useProjectMemberListQuery } from "@/app/(server-setup)/hooks/useServerMutation";

interface UserSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  directMessages: DirectMessage[];
  serverId: string;
  projectId: number;
  isSidebarOpen: boolean;
  isMobile: boolean;
  isTablet: boolean;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  activeTab,
  setActiveTab,
  directMessages,
  serverId,
  projectId,
  isSidebarOpen,
  isMobile,
  isTablet,
}) => {
  const projectMemberListQuery = useProjectMemberListQuery(serverId, projectId);
  console.log("projectMemberListQuery", projectMemberListQuery);
  const projectMemberList = projectMemberListQuery.data;
  console.log("projectMemberList", projectMemberList);
  if (!isSidebarOpen) return null;

  return (
    <div
      className={`bg-gray-600 flex flex-col rounded-tl-lg ${
        isMobile ? "w-full" : isTablet ? "w-56" : "w-64"
      }`}
    >
      {/* 탭 헤더 */}
      <div className="relative border-b border-gray-500">
        <div className="flex">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`
              flex-1 py-3 font-medium transition-colors
              ${isMobile ? "px-2 text-xs" : "px-4 text-sm"}
              ${
                activeTab === "favorites"
                  ? "text-white"
                  : "text-gray-300 hover:text-white"
              }
            `}
          >
            프로젝트 멤버
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`
              flex-1 py-3 font-medium transition-colors
              ${isMobile ? "px-2 text-xs" : "px-4 text-sm"}
              ${
                activeTab === "messages"
                  ? "text-white"
                  : "text-gray-300 hover:text-white"
              }
            `}
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
      <div className={`flex-1 overflow-y-auto ${isMobile ? "p-2" : "p-3"}`}>
        {activeTab === "favorites" ? (
          /* 프로젝트 멤버 탭 */
          <div className={`${isMobile ? "space-y-2" : "space-y-4"}`}>
            {/* 온라인 사용자 섹션 */}
            <div>
              <h3
                className={`
                text-white font-medium mb-3
                ${isMobile ? "text-xs" : "text-sm"}
              `}
              >
                온라인 ———{" "}
                {
                  projectMemberList?.filter((u) => u.pStatus === "Active")
                    .length
                }
              </h3>
              <div className={`${isMobile ? "space-y-1" : "space-y-2"}`}>
                {projectMemberList
                  ?.filter((member) => member.pStatus === "Active")
                  .map((member) => (
                    <Link
                      key={member.userInfo.userEmail}
                      href={`/${serverId}/projects/${projectId}/messages/${member.userInfo.userEmail}`}
                      className="group block"
                    >
                      <div
                        className={`
                        flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer
                        ${isMobile ? "p-1" : "p-2"}
                      `}
                      >
                        <div className="relative flex-shrink-0">
                          <div
                            className={`
                            rounded-full bg-gray-500 flex items-center justify-center text-white font-medium
                            ${isMobile ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}
                          `}
                          >
                            {member.userInfo.userName.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`
                            absolute bottom-0 right-0 border-2 border-gray-600 rounded-full
                            ${
                              member.pStatus === "Active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }
                            ${isMobile ? "w-2 h-2" : "w-3 h-3"}
                          `}
                          ></div>
                        </div>
                        <div
                          className={`ml-2 ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          {member.userInfo.userName}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            {/* 오프라인 사용자 섹션 */}
            <div>
              <h3
                className={`
                text-white font-medium mb-3
                ${isMobile ? "text-xs" : "text-sm"}
              `}
              >
                오프라인 ———{" "}
                {
                  projectMemberList?.filter((u) => u.pStatus === "Inactive")
                    .length
                }
              </h3>
              <div className={`${isMobile ? "space-y-1" : "space-y-2"}`}>
                {projectMemberList
                  ?.filter((member) => member.pStatus === "Inactive")
                  .map((member) => (
                    <Link
                      key={member.userInfo.userEmail}
                      href={`/${serverId}/projects/${projectId}/messages/${member.userInfo.userEmail}`}
                      className="group block"
                    >
                      <div
                        className={`
                        flex items-center text-gray-400 hover:text-gray-300 transition-colors cursor-pointer
                        ${isMobile ? "p-1" : "p-2"}
                      `}
                      >
                        <div className="relative flex-shrink-0">
                          <div
                            className={`
                            rounded-full bg-gray-500 flex items-center justify-center text-white font-medium
                            ${isMobile ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}
                          `}
                          >
                            {member.userInfo.userName.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`
                            absolute bottom-0 right-0 border-2 border-gray-600 rounded-full
                            ${
                              member.pStatus === "Active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }
                            ${isMobile ? "w-2 h-2" : "w-3 h-3"}
                          `}
                          ></div>
                        </div>
                        <div
                          className={`ml-2 ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          {member.userInfo.userName}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* 개인 메시지 탭 */
          <div className={`${isMobile ? "space-y-1" : "space-y-2"}`}>
            {directMessages.length === 0 ? (
              <div
                className={`
                text-gray-400 text-center
                ${isMobile ? "text-xs py-4" : "text-sm py-8"}
              `}
              >
                개인 메시지가 없습니다
              </div>
            ) : (
              directMessages.map((dm) => (
                <div
                  key={dm.id}
                  className={`
                    flex items-center text-gray-300 hover:text-white hover:bg-gray-700 
                    transition-colors cursor-pointer rounded
                    ${isMobile ? "p-1" : "p-2"}
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`
                      rounded-full bg-gray-500 flex items-center justify-center text-white font-medium
                      ${isMobile ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}
                    `}
                    >
                      {dm.name.charAt(0).toUpperCase()}
                    </div>
                    {dm.status === "online" && (
                      <div
                        className={`
                        absolute bottom-0 right-0 bg-green-500 border-2 border-gray-600 rounded-full
                        ${isMobile ? "w-2 h-2" : "w-3 h-3"}
                      `}
                      ></div>
                    )}
                  </div>
                  <div className="ml-2 min-w-0 flex-1">
                    <div
                      className={`
                      font-medium
                      ${isMobile ? "text-xs" : "text-sm"}
                    `}
                    >
                      {dm.name}
                    </div>
                    {dm.lastMessage && (
                      <div
                        className={`
                        text-gray-400 truncate
                        ${isMobile ? "text-xs" : "text-xs"}
                      `}
                      >
                        {dm.lastMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
