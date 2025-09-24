import React from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/app/(server-setup)/types/Projcets";
import { useChannelListQuery } from "@/app/(server-setup)/hooks/useServerMutation";
import { createChannelUrl } from "@/app/(server-setup)/utils/serverAccessUtils";

interface ProjectItemProps {
  project: Project;
  serverId: string;
  isActive: boolean;
  isMobile: boolean;
  index: number;
  onContextMenu: (e: React.MouseEvent, projectId: number) => void;
  showDropdown: boolean;
  onDropdownClick: (e: React.MouseEvent) => void;
  serverUrl: string; // 서버 URL 추가
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  serverId,
  isActive,
  isMobile,
  index,
  onContextMenu,
  showDropdown,
  onDropdownClick,
  serverUrl,
}) => {
  const router = useRouter();

  // 해당 프로젝트의 채널 목록 조회
  const channelListQuery = useChannelListQuery(serverUrl, project.projectPk);

  // 프로젝트 클릭 핸들러
  const handleProjectClick = async () => {
    try {
      let channels = channelListQuery.data;

      // 채널 데이터가 없으면 새로 조회
      if (!channels || channels.length === 0) {
        const result = await channelListQuery.refetch();
        channels = result.data;
      }

      // 첫 번째 채널로 이동
      if (channels && channels.length > 0) {
        const firstChannel = channels[0];
        const targetUrl = createChannelUrl(
          serverId,
          project.projectPk,
          firstChannel.channelName,
          firstChannel.channelKind
        );
        console.log(
          `🎯 프로젝트 "${project.projectName}"의 첫 번째 채널로 이동: ${firstChannel.channelName}`
        );
        router.push(targetUrl);
      } else {
        // 채널이 없으면 기본 경로로 이동
        console.log(
          `⚠️ 프로젝트 "${project.projectName}"에 채널이 없어 기본 경로로 이동`
        );
        router.push(`/${serverId}/projects/${project.projectPk}/channels/일반`);
      }
    } catch (error) {
      console.error("프로젝트 이동 실패:", error);
      // 에러 시 기본 경로로 이동
      router.push(`/${serverId}/projects/${project.projectPk}/channels/일반`);
    }
  };

  return (
    <div className="relative mb-2">
      <div
        className={`block ${
          index === 0 ? "rounded-tr-lg rounded-br-lg rounded-bl-lg" : "rounded"
        } cursor-pointer transition-colors ${
          isActive ? "bg-blue-600" : "hover:bg-gray-700"
        }`}
        onClick={handleProjectClick}
        onContextMenu={(e: React.MouseEvent) =>
          onContextMenu(e, project.projectPk)
        }
      >
        <div
          className={`flex items-center justify-center ${
            isMobile ? "p-1.5" : "p-2"
          }`}
        >
          <div
            className={`
            bg-purple-500 rounded flex items-center justify-center
            ${isMobile ? "w-8 h-8" : "w-10 h-10"}
          `}
          >
            <span
              className={`
              text-white font-semibold
              ${isMobile ? "text-xs" : "text-sm"}
            `}
            >
              {project.projectName[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 프로젝트 우클릭 드롭다운 */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 mt-1 w-48 bg-gray-700 rounded shadow-lg z-[9999] border border-gray-600"
          onClick={onDropdownClick}
        >
          <button
            onClick={() => {
              console.log(`프로젝트 ${project.projectName}에서 나가기`);
            }}
            className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-600 transition-colors rounded"
          >
            <div className="flex items-center">
              <span className="mr-3">🚪</span>
              <div>
                <div className="font-medium">프로젝트에서 나가기</div>
                <div className="text-xs text-gray-400">
                  {project.projectName}에서 나가기
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
