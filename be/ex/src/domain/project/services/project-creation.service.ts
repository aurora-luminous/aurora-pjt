import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { ProjectMember } from "../entities/project-member.entity";
import { Server } from "../../server/entities/server.entity";
import { ServerMember } from "../../server/entities/server-member.entity";
import { User } from "../../user/entities/user.entity";
import { CreateProjectDto, ProjectResponseDto } from "../dto";

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
        // 1. 서버 존재 확인 (serverUrl 또는 serverPk로)
        let server;
        if (createProjectDto.serverUrl) {
            server = await this.serverRepository.findOne({
                where: { serverUrl: createProjectDto.serverUrl, isDeletedServer: false }
            });
            if (!server) {
                throw new NotFoundException(`Server with URL ${createProjectDto.serverUrl} not found`);
            }
        } else if (createProjectDto.serverPk) {
            server = await this.serverRepository.findOne({
                where: { serverPk: createProjectDto.serverPk, isDeletedServer: false }
            });
            if (!server) {
                throw new NotFoundException(`Server with ID ${createProjectDto.serverPk} not found`);
            }
        } else {
            throw new NotFoundException('Either serverUrl or serverPk must be provided');
        }

        // 2. 사용자가 해당 서버의 멤버인지 확인
        const serverMember = await this.serverMemberRepository.findOne({
        where: { 
            serverPk: server.serverPk, 
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
        serverPk: server.serverPk,
        projectName: createProjectDto.projectName,
        });
        const savedProject = await this.projectRepository.save(project);

        // 5. 생성자를 프로젝트 owner로 추가
        const projectMember = this.projectMemberRepository.create({
        projectPk: savedProject.projectPk,
        userPk: createProjectDto.creatorUserPk,
        pStatus: 'Active', // 기본 상태
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
            userName: serverMember.user.userName,
        },
        };
    }

    async getProjectsByServerForUser(serverUrl: string, userPk: number): Promise<ProjectResponseDto[]> {
        // 서버 존재 확인
        const server = await this.serverRepository.findOne({
        where: { serverUrl, isDeletedServer: false }
        });

        if (!server) {
        throw new NotFoundException(`Server with URL ${serverUrl} not found`);
        }

        // 사용자가 속한 프로젝트만 조회
        const projectMembers = await this.projectMemberRepository.find({
            where: { 
                userPk: userPk,
                pStatus: 'Active'
            },
            relations: ['project', 'project.projectMembers', 'project.projectMembers.user', 'project.server'],
        });

        return projectMembers
            .filter(member => member.project.serverPk === server.serverPk && !member.project.isDeletedProject)
            .map(member => {
                const project = member.project;
                const owner = project.projectMembers.find(pm => pm.projectRole === 'owner');
                
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
                        
                        userName: owner.user.userName,
                    } : undefined,
                };
            });
    }

    async getProjectsByServer(serverUrl: string): Promise<ProjectResponseDto[]> {
        // 서버 존재 확인
        const server = await this.serverRepository.findOne({
        where: { serverUrl, isDeletedServer: false }
        });

        if (!server) {
        throw new NotFoundException(`Server with URL ${serverUrl} not found`);
        }

        const projects = await this.projectRepository.find({
            where: { serverPk: server.serverPk, isDeletedProject: false },
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
            
            userName: owner.user.userName,
        } : undefined,
        };
    }
}