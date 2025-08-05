import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../../entities/project.entity";
import { ProjectMember } from "../../../entities/project-member.entity";
import { Server } from "../../../entities/server.entity";
import { ServerMember } from "../../../entities/server-member.entity";
import { User } from "../../../entities/user.entity";

export interface CreateProjectDto {
    serverPk: number;
    projectName: string;
    creatorUserPk: number;
}

export interface ProjectResponseDto {
    projectPk: number;
    serverPk: number;
    projectName: string;
    isDeletedProject: boolean;
    serverInfo?: {
        serverPk: number;
        serverName: string;
    };
    ownerInfo?: {
        userPk: number;
        userName: string;
    };
}

@Injectable()
export class ProjectCreationService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
        @InjectRepository(ServerMember)
        private readonly serverMemberRepository: Repository<ServerMember>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async createProject(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
        // 1. 서버 존재 확인
        const server = await this.serverRepository.findOne({
        where: { serverPk: createProjectDto.serverPk, isDeletedServer: false }
        });

        if (!server) {
        throw new NotFoundException(`Server with ID ${createProjectDto.serverPk} not found`);
        }

        // 2. 사용자가 해당 서버의 멤버인지 확인
        const serverMember = await this.serverMemberRepository.findOne({
        where: { 
            serverPk: createProjectDto.serverPk, 
            userPk: createProjectDto.creatorUserPk,
            status: 'Approved'
        },
        relations: ['user']
        });

        if (!serverMember) {
        throw new ForbiddenException('User is not a member of this server');
        }

        // 3. 관리자 권한 확인 (admin 또는 owner만 프로젝트 생성 가능)
        if (!['admin', 'owner'].includes(serverMember.serverRole)) {
        throw new ForbiddenException('Only admin or owner can create projects');
        }

        // 4. 프로젝트 생성
        const project = this.projectRepository.create({
        serverPk: createProjectDto.serverPk,
        projectName: createProjectDto.projectName,
        });
        const savedProject = await this.projectRepository.save(project);

        // 5. 생성자를 프로젝트 owner로 추가
        const projectMember = this.projectMemberRepository.create({
        projectPk: savedProject.projectPk,
        userPk: createProjectDto.creatorUserPk,
        projectRole: 'owner',
        });
        await this.projectMemberRepository.save(projectMember);

        return {
        projectPk: savedProject.projectPk,
        serverPk: savedProject.serverPk,
        projectName: savedProject.projectName,
        isDeletedProject: savedProject.isDeletedProject,
        serverInfo: {
            serverPk: server.serverPk,
            serverName: server.serverName,
        },
        ownerInfo: {
            userPk: serverMember.user.userPk,
            userName: serverMember.user.userName,
        },
        };
    }

    async getProjectsByServer(serverPk: number): Promise<ProjectResponseDto[]> {
        // 서버 존재 확인
        const server = await this.serverRepository.findOne({
        where: { serverPk, isDeletedServer: false }
        });

        if (!server) {
        throw new NotFoundException(`Server with ID ${serverPk} not found`);
        }

        const projects = await this.projectRepository.find({
            where: { serverPk, isDeletedProject: false },
            relations: ['projectMembers', 'projectMembers.user', 'server'],
        });

        return projects.map(project => {
            const owner = project.projectMembers.find(member => member.projectRole === 'owner');
        
            return {
                projectPk: project.projectPk,
                serverPk: project.serverPk,
                projectName: project.projectName,
                isDeletedProject: project.isDeletedProject,
                serverInfo: {
                serverPk: project.server.serverPk,
                serverName: project.server.serverName,
                },
                ownerInfo: owner ? {
                userPk: owner.user.userPk,
                userName: owner.user.userName,
                } : undefined,
            };
        });
    }

    async getProjectById(projectPk: number): Promise<ProjectResponseDto> {
        const project = await this.projectRepository.findOne({
        where: { projectPk, isDeletedProject: false },
        relations: ['projectMembers', 'projectMembers.user', 'server'],
        });

        if (!project) {
        throw new NotFoundException(`Project with ID ${projectPk} not found`);
        }

        const owner = project.projectMembers.find(member => member.projectRole === 'owner');

        return {
        projectPk: project.projectPk,
        serverPk: project.serverPk,
        projectName: project.projectName,
        isDeletedProject: project.isDeletedProject,
        serverInfo: {
            serverPk: project.server.serverPk,
            serverName: project.server.serverName,
        },
        ownerInfo: owner ? {
            userPk: owner.user.userPk,
            userName: owner.user.userName,
        } : undefined,
        };
    }
}