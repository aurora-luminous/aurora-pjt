import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Server } from "../entities/server.entity";
import { ServerMember } from "../entities/server-member.entity";
import { User } from "../../user/entities/user.entity";
import { Project } from "../../project/entities/project.entity";
import { ProjectMember } from "../../project/entities/project-member.entity";
import { CreateServerDto, ServerResponseDto } from "../dto";

@Injectable()
export class ServerCreationService {
    constructor (
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
        @InjectRepository(ServerMember)
        private readonly serverMemberRepository: Repository<ServerMember>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
    ) {}

    async createServer(createServerDto: CreateServerDto): Promise<ServerResponseDto> {
        // 1. 사용자 존재 확인
        const user = await this.userRepository.findOne({
        where: { userPk: createServerDto.creatorUserPk, isDeleted: false }
        });

        if (!user) {
        throw new NotFoundException(`User with ID ${createServerDto.creatorUserPk} not found`);
        }

        // 2. 서버 생성
        const server = this.serverRepository.create({
        serverName: createServerDto.serverName,
        serverUrl: createServerDto.serverUrl,
        });
        const savedServer = await this.serverRepository.save(server);

        // 3. 생성자를 owner로 서버 멤버에 추가
        const serverMember = this.serverMemberRepository.create({
        userPk: createServerDto.creatorUserPk,
        serverPk: savedServer.serverPk,
        sStatus: 'Active', // 기본 상태
        status: 'Approved', // 생성자는 자동 승인
        serverRole: 'owner', // 생성자는 owner 권한
        });
        await this.serverMemberRepository.save(serverMember);

        // 4. 기본 "일반" 프로젝트 생성 (홈 화면 대용)
        const defaultProject = this.projectRepository.create({
        serverPk: savedServer.serverPk,
        projectName: '일반', // 기본 프로젝트명
        });
        const savedProject = await this.projectRepository.save(defaultProject);

        // 5. 서버 생성자를 기본 프로젝트 owner로 추가
        const projectMember = this.projectMemberRepository.create({
        projectPk: savedProject.projectPk,
        userPk: createServerDto.creatorUserPk,
        pStatus: 'Active', // 기본 상태
        projectRole: 'owner',
        });
        await this.projectMemberRepository.save(projectMember);

        return {
        serverPk: savedServer.serverPk,
        serverName: savedServer.serverName,
        serverUrl: savedServer.serverUrl,
        isDeletedServer: savedServer.isDeletedServer,
        ownerInfo: {
            userName: user.userName,
            userEmail: user.userEmail,
        },
        };
    }

    async getUserServers(userPk: number): Promise<ServerResponseDto[]> {
        const serverMembers = await this.serverMemberRepository.find({
            where: { 
                userPk: userPk,
                sStatus: 'Active'
            },
            relations: ['server', 'server.serverMembers', 'server.serverMembers.user'],
        });

        return serverMembers
            .filter(member => !member.server.isDeletedServer)
            .map(member => {
                const server = member.server;
                const owner = server.serverMembers.find(sm => sm.serverRole === 'owner');
                
                return {
                    serverPk: server.serverPk,
                    serverName: server.serverName,
                    serverUrl: server.serverUrl,
                    isDeletedServer: server.isDeletedServer,
                    ownerInfo: owner ? {
                        userName: owner.user.userName,
                        userEmail: owner.user.userEmail,
                    } : undefined,
                };
            });
    }

    async getAllServers(): Promise<ServerResponseDto[]> {
        const servers = await this.serverRepository.find({
        where: { isDeletedServer: false },
        relations: ['serverMembers', 'serverMembers.user'],
        });

        return servers.map(server => {
        const owner = server.serverMembers.find(member => member.serverRole === 'owner');
        
        return {
            serverPk: server.serverPk,
            serverName: server.serverName,
            serverUrl: server.serverUrl,
            isDeletedServer: server.isDeletedServer,
            ownerInfo: owner ? {
            
            userName: owner.user.userName,
            userEmail: owner.user.userEmail,
            } : undefined,
        };
        });
    }

    async getServerById(serverPk: number): Promise<ServerResponseDto> {
        const server = await this.serverRepository.findOne({
        where: { serverPk, isDeletedServer: false },
        relations: ['serverMembers', 'serverMembers.user'],
        });

        if (!server) {
        throw new NotFoundException(`Server with ID ${serverPk} not found`);
        }

        const owner = server.serverMembers.find(member => member.serverRole === 'owner');

        return {
        serverPk: server.serverPk,
        serverName: server.serverName,
        serverUrl: server.serverUrl,
        isDeletedServer: server.isDeletedServer,
        ownerInfo: owner ? {
            
            userName: owner.user.userName,
            userEmail: owner.user.userEmail,
        } : undefined,
        };
    }

    async getServerByUrl(serverUrl: string): Promise<ServerResponseDto> {
        const server = await this.serverRepository.findOne({
        where: { serverUrl, isDeletedServer: false },
        relations: ['serverMembers', 'serverMembers.user'],
        });

        if (!server) {
        throw new NotFoundException(`Server with URL ${serverUrl} not found`);
        }

        const owner = server.serverMembers.find(member => member.serverRole === 'owner');

        return {
        serverPk: server.serverPk,
        serverName: server.serverName,
        serverUrl: server.serverUrl,
        isDeletedServer: server.isDeletedServer,
        ownerInfo: owner ? {
            userName: owner.user.userName,
            userEmail: owner.user.userEmail,
        } : undefined,
        };
    }
}