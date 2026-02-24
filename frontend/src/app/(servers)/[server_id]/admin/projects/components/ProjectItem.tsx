"use client"

import { useResponsive } from "@/app/lib/useResponsive";

interface ProjectItemProps {
    projectName: string;
    projectPk: number;
    onDelete: (projectPk: number) => void;
    position?: number;
}

export const ProjectItem = ({ projectName, projectPk, onDelete }: ProjectItemProps) => {
    const { isMobile } = useResponsive();

    const handleDeleteClick = () => {
        if (confirm(`"${projectName}" 프로젝트를 삭제하시겠습니까?`)) {
            onDelete(projectPk);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className={`${isMobile ? "p-3" : "p-4"} flex items-center justify-between`}>
                {/* 왼쪽: 번호 + 아이콘 + 이름 */}
                <div className={`flex items-center ${isMobile ? "space-x-2" : "space-x-4"}`}>
                    {/* 폴더 아이콘 */}
                    <div className={`flex items-center justify-center rounded-md text-indigo-400 ${isMobile ? "w-7 h-7 text-sm" : "w-9 h-9 text-base"}`}>
                        📁
                    </div>
                    <div>
                        <h3 className={`text-white font-medium ${isMobile ? "text-sm" : "text-base"}`}>
                            {projectName}
                        </h3>
                    </div>
                </div>

                {/* 오른쪽: 삭제 버튼 */}
                <button
                    onClick={handleDeleteClick}
                    className={`text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors ${isMobile ? "p-1 text-sm" : "p-2"}`}
                    title="삭제"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};