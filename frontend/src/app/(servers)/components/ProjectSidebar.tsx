import React from "react";
import Link from "next/link";
import { Project, Channel } from "../types";
import { projects, channels } from "../types/data";

interface ProjectSidebarProps {
  serverId: string;
  projectId: string;
  channelId: string;
  isProjectActive: (projectId: string) => boolean;
  isProjectSelected: boolean;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  serverId,
  projectId,
  channelId,
  isProjectActive,
  isProjectSelected,
}) => {
  return (
    <div className="flex flex-col h-full bg-aurora-main rounded-tl-lg">
      <div className="flex flex-1">
        {/* 왼쪽: 프로젝트 목록 */}
        <div className="w-16 bg-gray-800 flex flex-col py-3">
          {/* 프로젝트 목록 */}
          <div className="flex-1 overflow-y-auto px-2">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/${serverId}/projects/${project.id}`}
                className={`block mb-2 ${
                  index === 0
                    ? "rounded-tr-lg rounded-br-lg rounded-bl-lg"
                    : "rounded"
                } cursor-pointer transition-colors ${
                  isProjectActive(project.id)
                    ? "bg-blue-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-center p-2">
                  <div
                    className={`w-10 h-10 ${project.color} rounded flex items-center justify-center`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {project.name[0]}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* 프로젝트 생성 버튼 */}
            <div className="mb-2 rounded cursor-pointer hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-600 hover:border-gray-500">
              <div className="flex items-center justify-center p-2">
                <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-white text-lg">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙: 채널 목록 (프로젝트 선택 시에만 표시) */}
        {isProjectSelected && (
          <div className="w-72 bg-gray-700 flex flex-col rounded-tl-lg rounded-tr-lg overflow-hidden">
            {/* 프로젝트 헤더 */}
            <div className="p-4 border-b border-gray-600 rounded-tl-lg rounded-tr-lg bg-transparent">
              <div className="flex items-center justify-between">
                <h1 className="text-white font-semibold text-lg">
                  SSAFY 연구팀
                </h1>
                <button className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500">
                  +
                </button>
              </div>
            </div>

            {/* 주요 일정 */}
            <div className="px-4 py-3 border-b border-gray-600">
              <h3 className="text-white text-sm font-medium mb-3 flex items-center">
                주요 일정
                <span className="ml-2">📅</span>
              </h3>
              <div className="space-y-1 text-sm text-white">
                <div>D-15 1차 발표</div>
                <div>D-30 2차 발표</div>
                <div>D-45 최종 발표회</div>
              </div>
            </div>

            {/* 채널 목록 */}
            <div className="px-4 py-3 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-xs font-semibold uppercase">
                  전체
                </h3>
                <button className="text-white hover:text-gray-200">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* 공지 채널 */}
              <div className="mb-4">
                {channels
                  .filter((c) => c.type === "notice")
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/${serverId}/projects/${projectId}/channels/${channel.id}`}
                      className={`flex items-center px-2 py-1 rounded cursor-pointer mb-1 transition-colors ${
                        channelId === channel.id
                          ? "bg-gray-600 text-white"
                          : "text-gray-300 hover:bg-gray-600 hover:text-white"
                      }`}
                    >
                      <span className="mr-2 text-gray-400">#</span>
                      <span className="text-sm">{channel.name}</span>
                    </Link>
                  ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-300 text-xs font-semibold uppercase">
                  채팅 채널
                </h3>
                <button className="text-gray-400 hover:text-gray-200">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* 채팅 채널 */}
              <div className="mb-4">
                {channels
                  .filter((c) => c.type === "text")
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/${serverId}/projects/${projectId}/channels/${channel.id}`}
                    >
                      <div
                        key={channel.id}
                        className={`flex items-center px-2 py-1 rounded cursor-pointer mb-1 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                          channelId === channel.id
                            ? "bg-gray-600 text-white"
                            : "text-gray-300 hover:bg-gray-600 hover:text-white"
                        }`}
                      >
                        <span className="mr-2 text-gray-400">🔊</span>
                        <span className="text-sm">{channel.name}</span>
                      </div>
                    </Link>
                  ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-300 text-xs font-semibold uppercase">
                  음성 채널
                </h3>
                <button className="text-gray-400 hover:text-gray-200">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                {channels
                  .filter((c) => c.type === "voice")
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/${serverId}/projects/${projectId}/voice_channels/${channel.id}`}
                    >
                      <div
                        key={channel.id}
                        className={`flex items-center px-2 py-1 rounded cursor-pointer mb-1 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                          channelId === channel.id
                            ? "bg-gray-600 text-white"
                            : "text-gray-300 hover:bg-gray-600 hover:text-white"
                        }`}
                      >
                        <span className="mr-2 text-gray-400">🔊</span>
                        <span className="text-sm">{channel.name}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단: 사용자 정보 (프로젝트+채널 영역에만 제한) */}
      {isProjectSelected && (
        <div className="flex bg-gray-800 border-t border-gray-600 rounded-tr-lg mr-2">
          <div className="w-4"></div>
          <div className="flex-1 p-4 flex items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 relative">
              <span className="text-gray-800 text-lg font-bold">심</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
            </div>
            <div className="flex-1">
              <div className="text-white text-base font-semibold">심근원</div>
              <div className="text-gray-300 text-sm">온라인</div>
            </div>
            <div className="flex space-x-2">
              <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
                🎤
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
                🎧
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
                ⚙️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
