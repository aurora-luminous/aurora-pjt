"use client"

import { useAdminPermission } from "@/app/(servers)/hooks/useAdmin";
import { useResponsive } from "@/app/lib/useResponsive"
import { useProjectManage } from "./hooks/useProjectManage";
import { useParams } from "next/navigation";
import { ProjectItem } from "./components/ProjectItem";

const ProjectsPage = () => {
    const { isMobile } = useResponsive();
    const {
        isAdmin,
        currentServerRole,
        isLoading: permissionLoading
    } = useAdminPermission();
    const serverUrl = useParams().server_id?.toString();
    const { projectList, deleteProject } = useProjectManage(serverUrl!);

    // 권한 확인 로딩 중
    if (permissionLoading) {
        return (
            <div className="flex h-full bg-gray-900 items-center justify-center">
                <div className={`text-white text-center ${isMobile ? "px-4" : "px-0"}`}>
                    <div className={`mb-4 ${isMobile ? "text-base" : "text-lg"}`}>
                        권한을 확인하는 중...
                    </div>
                    <div className={`border-2 border-white border-t-transparent rounded-full animate-spin mx-auto ${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />
                </div>
            </div>
        );
    }

    // 권한이 없는 경우
    if (!isAdmin) {
        return (
            <div className="flex h-full bg-gray-900 items-center justify-center">
                <div className={`text-center bg-red-900/20 border border-red-600 rounded-lg ${isMobile ? "p-6 mx-4 max-w-sm" : "p-8 max-w-md"}`}>
                    <div className={`text-red-400 mb-4 ${isMobile ? "text-4xl" : "text-6xl"}`}>🚫</div>
                    <h1 className={`text-white font-bold mb-2 ${isMobile ? "text-xl" : "text-2xl"}`}>
                        접근 권한이 없습니다
                    </h1>
                    <p className={`text-gray-300 mb-4 ${isMobile ? "text-sm" : "text-base"}`}>
                        관리자 페이지는 서버 소유자 또는 관리자만 접근할 수 있습니다.
                    </p>
                    <p className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                        현재 권한:{" "}
                        <span className="text-yellow-400">
                            {currentServerRole ? currentServerRole.serverRole : "Member"}
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full overflow-auto ${isMobile ? "p-4" : "p-6"}`}>
            {/* 헤더 */}
            <div className="mb-6">
                <h1 className={`font-bold text-white mb-2 ${isMobile ? "text-xl" : "text-2xl"}`}>
                    프로젝트 관리
                </h1>
                <p className={`text-gray-400 ${isMobile ? "text-sm" : "text-base"}`}>
                    서버의 프로젝트 목록을 확인하고 관리하세요.
                </p>
            </div>

            {/* 안내 메시지 */}
            <div className={`mb-6 bg-indigo-900/20 border border-indigo-500/30 rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
                <div className={`flex items-start ${isMobile ? "space-x-2" : "space-x-3"}`}>
                    <span className={`text-indigo-400 ${isMobile ? "text-base" : "text-lg"}`}>💡</span>
                    <div>
                        <h3 className={`text-indigo-200 font-medium mb-1 ${isMobile ? "text-sm" : "text-base"}`}>
                            프로젝트 안내
                        </h3>
                        <p className={`text-indigo-300 ${isMobile ? "text-xs" : "text-sm"}`}>
                            프로젝트를 삭제하면 해당 프로젝트의 모든 채널과 데이터가 함께 삭제됩니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* 프로젝트 목록 */}
            <div className="space-y-4">
                {projectList?.map((project, index) => (
                    <ProjectItem
                        key={project.projectPk}
                        projectName={project.projectName}
                        projectPk={project.projectPk}
                        onDelete={deleteProject.mutate}
                        position={index + 1}
                    />
                ))}
            </div>

            {/* 빈 목록 */}
            {(!projectList || projectList.length === 0) && (
                <div className="text-center py-12">
                    <div className={`text-gray-400 mb-2 ${isMobile ? "text-sm" : "text-base"}`}>
                        생성된 프로젝트가 없습니다.
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectsPage