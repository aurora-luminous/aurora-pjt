import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { User } from '../../user/entities/user.entity';
import { Server } from '../../server/entities/server.entity';

@Injectable()
export class ProjectUpdateService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
    ) {}

    async updateProjectName(serverUrl: string, projectPk: number, newProjectName: string, modifierUserPk: number): Promise<Project> {
        // 1. 서버 찾기
        const server = await this.serverRepository.findOne({ where: { serverUrl, isDeletedServer: false } });
        if (!server) {
            throw new NotFoundException(`서버 URL ${serverUrl}을 찾을 수 없습니다.`);
        }

        // 2. 프로젝트 찾기
        const project = await this.projectRepository.findOne({ where: { projectPk, serverPk: server.serverPk, isDeletedProject: false } });
        if (!project) {
            throw new NotFoundException(`프로젝트 ID ${projectPk}를 찾을 수 없습니다.`);
        }

        // 3. 요청 보내는 멤버 권한 확인
        const projectMember = await this.projectMemberRepository.findOne({
            where: { projectPk, userPk: modifierUserPk, pStatus: 'Active' },
        });

        // 프로젝트 멤버가 아니거나 권한이 admin이 아닐 경우 에러 던짐
        if (!projectMember || projectMember.projectRole !== 'admin') {
            throw new ForbiddenException('프로젝트 이름을 변경할 권한이 없습니다.');
        }

        // 4. 프로젝트 이름 갱신 후 DB에 반영
        project.projectName = newProjectName;

        await this.projectRepository.save(project);

        return project;
    }
}
