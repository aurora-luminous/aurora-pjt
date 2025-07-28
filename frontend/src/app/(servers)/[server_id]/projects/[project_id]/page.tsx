"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ProjectPage = () => {
  const params = useParams();
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;

  // 프로젝트 이름 가져오기
  const getProjectName = (id: string) => {
    const projectNames: { [key: string]: string } = {
      general: "일반",
      "main-schedule": "주요 일정",
    };
    return projectNames[id] || id.replace(/-/g, " ").toUpperCase();
  };

  return (
    <div className="h-full flex items-center justify-center rounded-tr-lg rounded-tl-lg bg-chatting-background">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {getProjectName(projectId)}에 오신 것을 환영합니다!
        </h2>

        <p className="text-gray-600 mb-6">
          왼쪽에서 채널을 선택하거나 오른쪽에서 팀원과 소통하세요.
        </p>

        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-center justify-center">
            <span className="mr-2">#</span>
            <span>텍스트 채널에서 팀과 소통하세요</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="mr-2">🔊</span>
            <span>음성 채널에서 실시간 대화하세요</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="mr-2">👥</span>
            <span>오른쪽 패널에서 온라인 사용자를 확인하세요</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-2">빠른 시작</h3>
          <div className="space-y-2 text-sm">
            <Link
              href={`/${serverId}/projects/${projectId}/channels/general`}
              className="block bg-gray-500 hover:bg-gray-400 text-white px-3 py-2 rounded transition"
            >
              # 일반 채널로 이동
            </Link>
            <Link
              href={`/${serverId}/projects/${projectId}/channels/announcements`}
              className="block bg-gray-500 hover:bg-gray-400 text-white px-3 py-2 rounded transition"
            >
              # 공지사항 채널로 이동
            </Link>
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition">
              팀원 초대하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
