import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { ProjectMember } from "../entities/project-member.entity";
import { Server } from "../../server/entities/server.entity";
import { ServerMember } from "../../server/entities/server-member.entity";
import { User } from "../../user/entities/user.entity";
import { Channel } from "../../text-channel/entities/channel.entity";
import { ChannelMember } from "../../text-channel/entities/channel-member.entity";
import { CreateProjectDto, ProjectResponseDto, ProjectListDto } from "../dto";
import { ServerRoleUtils } from "../../../common/enums/member-role.enum";
import { ProjectNotificationService } from "./project-notification.service";

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
        @InjectRepository(Channel)
        private readonly channelRepository: Repository<Channel>,
        @InjectRepository(ChannelMember)
        private readonly channelMemberRepository: Repository<ChannelMember>,
        private readonly projectNotificationService: ProjectNotificationService,
    ) {}

    async createProject(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
        // 1. 서버 존재 확인 (serverUrl 또는 serverPk로)
        let server;
        if (createProjectDto.serverUrl) {
            server = await this.serverRepository.findOne({
                where: { serverUrl: createProjectDto.serverUrl, isDeletedServer: false }
            });
            if (!server) {
                throw new NotFoundException(`서버 URL ${createProjectDto.serverUrl}을 찾을 수 없습니다`);
            }
        } else if (createProjectDto.serverPk) {
            server = await this.serverRepository.findOne({
                where: { serverPk: createProjectDto.serverPk, isDeletedServer: false }
            });
            if (!server) {
                throw new NotFoundException(`서버 ID ${createProjectDto.serverPk}를 찾을 수 없습니다`);
            }
        } else {
            throw new NotFoundException('serverUrl 또는 serverPk 중 하나는 반드시 제공되어야 합니다');
        }

        // 2. 사용자가 해당 서버의 멤버인지 확인
        const serverMember = await this.serverMemberRepository.findOne({
        where: { 
            serverPk: server.serverPk, 
            userPk: createProjectDto.creatorUserPk,
            sStatus: 'Active'
        },
        relations: ['user']
        });

        if (!serverMember) {
            throw new ForbiddenException('사용자가 이 서버의 멤버가 아닙니다');
        }

        // 3. 프로젝트 생성 권한 확인 (admin, owner, projectManager 가능)
        if (!ServerRoleUtils.hasProjectCreatePermission(serverMember.serverRole)) {    
            throw new ForbiddenException('관리자, 소유자 또는 프로젝트 매니저만 프로젝트를 생성할 수 있습니다');
        }

        // 4. 프로젝트 생성
        const project = this.projectRepository.create({
        serverPk: server.serverPk,
        projectName: createProjectDto.projectName,
        });
        const savedProject = await this.projectRepository.save(project);

        // 5. 생성자를 프로젝트 admin으로 추가
        const projectMember = this.projectMemberRepository.create({
        projectPk: savedProject.projectPk,
        userPk: createProjectDto.creatorUserPk,
        pStatus: 'Active', // 기본 상태
        projectRole: 'admin',
        });
        await this.projectMemberRepository.save(projectMember);

        // 6. 기본 "일반" 채널 생성
        const defaultChannel = this.channelRepository.create({
        projectPk: savedProject.projectPk,
        channelName: '일반',
        channelKind: 'TEXT', // 텍스트 채널
        });
        const savedChannel = await this.channelRepository.save(defaultChannel);

        // 7. 생성자를 채널 멤버로 추가
        const channelMember = this.channelMemberRepository.create({
        channelPk: savedChannel.channelPk,
        userPk: createProjectDto.creatorUserPk,
        cStatus: 'Active',
        channelRole: 'admin',
        });
        await this.channelMemberRepository.save(channelMember);

        // 알림 전송 (비동기)
        this.projectNotificationService.notifyProjectAdded(savedProject.projectPk, savedProject.projectName);

        return {
        projectPk: savedProject.projectPk,
        serverPk: savedProject.serverPk,
        projectName: savedProject.projectName,
        isDeletedProject: savedProject.isDeletedProject,
        serverInfo: {
            serverPk: server.serverPk,
            serverName: server.serverName,
        },
        adminInfo: {
            userName: serverMember.user.userName,
        },
        };
    }

    async getProjectsByServerForUser(serverUrl: string, userPk: number): Promise<ProjectListDto[]> {
        // 서버 존재 확인
        const server = await this.serverRepository.findOne({
        where: { serverUrl, isDeletedServer: false }
        });

        if (!server) {
        throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다`);
        }

        // 사용자가 속한 프로젝트만 조회
        const projectMembers = await this.projectMemberRepository.find({
            where: { 
                userPk: userPk,
                pStatus: 'Active'
            },
            relations: ['project'],
        });

        return projectMembers
            .filter(member => member.project.serverPk === server.serverPk && !member.project.isDeletedProject)
            .map(member => ({
                projectPk: member.project.projectPk,
                projectName: member.project.projectName,
            }));
    }

    async getProjectsByServer(serverUrl: string): Promise<ProjectResponseDto[]> {
        // 서버 존재 확인
        const server = await this.serverRepository.findOne({
        where: { serverUrl, isDeletedServer: false }
        });

        if (!server) {
        throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다`);
        }

        const projects = await this.projectRepository.find({
            where: { serverPk: server.serverPk, isDeletedProject: false },
            relations: ['projectMembers', 'projectMembers.user', 'server'],
        });

        return projects.map(project => {
            const admin = project.projectMembers.find(member => member.projectRole === 'admin');
        
            return {
                projectPk: project.projectPk,
                serverPk: project.serverPk,
                projectName: project.projectName,
                isDeletedProject: project.isDeletedProject,
                serverInfo: {
                serverPk: project.server.serverPk,
                serverName: project.server.serverName,
                },
                adminInfo: admin ? {
                
                userName: admin.user.userName,
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
        throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다`);
        }

        const admin = project.projectMembers.find(member => member.projectRole === 'admin');

        return {
        projectPk: project.projectPk,
        serverPk: project.serverPk,
        projectName: project.projectName,
        isDeletedProject: project.isDeletedProject,
        serverInfo: {
            serverPk: project.server.serverPk,
            serverName: project.server.serverName,
        },
        adminInfo: admin ? {
            
            userName: admin.user.userName,
        } : undefined,
        };
    }
}