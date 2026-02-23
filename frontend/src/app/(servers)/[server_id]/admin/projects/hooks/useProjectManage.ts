import { useDeleteProjectMutation, useProjectListQuery } from "@/app/(server-setup)/hooks/useServerMutation"

export const useProjectManage = (serverUrl : string) => {
    const {data : projectList} = useProjectListQuery(serverUrl);

    const deleteProject = useDeleteProjectMutation(serverUrl);

    return {
        projectList,
        deleteProject
    }
}