pipeline {
    agent any
    options {
        timestamps()
    }

    parameters {
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['fe', 'sp', 'ex', 'sfu'],
            description: '배포 대상 (자동 배포 시 브랜치명으로 결정). sfu는 SFU 서버(168.107.24.251)로 배포.'
        )
        string(name: 'TAG', defaultValue: '', description: '커스텀 태그 (비워두면 자동 생성)')
    }

    environment {
        COMPOSE_PROJECT_NAME = 'aurora'
        COMPOSE_FILE = 'docker-compose.yml'
        SFU_COMPOSE_FILE = 'docker-compose.sfu.yml'

        // 앱 스택 (fe, sp, ex)
        APP_DEPLOY_HOST = '168.107.0.140'
        APP_OPERATING_DIR = '/home/ubuntu/aurora'

        // SFU 스택 (mediasoup, nginx) — 추후 sfu 브랜치 머지 시 사용
        SFU_DEPLOY_HOST = '168.107.24.251'
        SFU_OPERATING_DIR = '/home/ubuntu/aurora-sfu'

        DEPLOY_SSH_USER = 'ubuntu'
        // Jenkins Credentials: SSH Username with private key (0.140 / 24.251 모두 접속 가능한 키 권장)
        DEPLOY_SSH_CRED = 'aurora-deploy-ssh'

        FE_IMAGE_REPO = 'docker.io/shimkwkr/aurora-frontend'
        SP_IMAGE_REPO = 'docker.io/shimkwkr/aurora-backend-sp'
        EX_IMAGE_REPO = 'docker.io/shimkwkr/aurora-backend-ex'
        SFU_IMAGE_REPO = 'docker.io/shimkwkr/aurora-sfu'

        DOCKERHUB = credentials('dockerhub-cred')
        DISCORD_WEBHOOK = credentials('discord-webhook-aurora')

        DB_PASSWORD = credentials('db-password')
        REDIS_PASSWORD = credentials('redis-password')
        JWT_SECRET = credentials('jwt-secret')
        INTERNAL_SECRET = credentials('internal-secret')
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Prepare & Compute TAGs') {
            steps {
                script {
                    def branchName = env.GIT_BRANCH ?: ''
                    echo "검출된 브랜치: ${branchName}"

                    if (branchName.contains('sfu')) {
                        env.ACTUAL_TARGET = 'sfu'
                    } else if (branchName.contains('sp')) {
                        env.ACTUAL_TARGET = 'sp'
                    } else if (branchName.contains('fe')) {
                        env.ACTUAL_TARGET = 'fe'
                    } else if (branchName.contains('ex')) {
                        env.ACTUAL_TARGET = 'ex'
                    } else {
                        env.ACTUAL_TARGET = params.DEPLOY_TARGET
                    }
                    echo "최종 결정된 배포 타겟: ${env.ACTUAL_TARGET}"

                    if (env.ACTUAL_TARGET == 'sfu') {
                        env.DEPLOY_HOST = env.SFU_DEPLOY_HOST
                        env.OPERATING_DIR = env.SFU_OPERATING_DIR
                        env.ACTIVE_COMPOSE_FILE = env.SFU_COMPOSE_FILE
                    } else {
                        env.DEPLOY_HOST = env.APP_DEPLOY_HOST
                        env.OPERATING_DIR = env.APP_OPERATING_DIR
                        env.ACTIVE_COMPOSE_FILE = env.COMPOSE_FILE
                    }
                    echo "배포 서버: ${env.DEPLOY_HOST} (${env.OPERATING_DIR})"

                    def dateTag = sh(returnStdout: true, script: 'date +%Y%m%d-%H%M%S').trim()
                    env.FINAL_TAG = params.TAG ?: "${dateTag}-${BUILD_NUMBER}"

                    writeFile file: '.ci.env', text: """
TAG=${env.FINAL_TAG}
FE_IMAGE_REPO=${env.FE_IMAGE_REPO}
SP_IMAGE_REPO=${env.SP_IMAGE_REPO}
EX_IMAGE_REPO=${env.EX_IMAGE_REPO}
SFU_IMAGE_REPO=${env.SFU_IMAGE_REPO}
DB_PASSWORD=${env.DB_PASSWORD}
REDIS_PASSWORD=${env.REDIS_PASSWORD}
JWT_SECRET=${env.JWT_SECRET}
INTERNAL_SECRET=${env.INTERNAL_SECRET}
""".trim()
                }
            }
        }

        stage('Build & Push Image') {
            steps {
                script {
                    sh "echo '${DOCKERHUB_PSW}' | docker login -u '${DOCKERHUB_USR}' --password-stdin docker.io"

                    if (env.ACTUAL_TARGET == 'fe') {
                        dir('frontend') { sh 'npm install && npm run build -- --no-lint' }
                        sh "docker compose -f ${env.COMPOSE_FILE} --env-file .ci.env build frontend"
                        sh "docker compose -f ${env.COMPOSE_FILE} --env-file .ci.env push frontend"
                    } else if (env.ACTUAL_TARGET == 'sp') {
                        dir('spbackend') { sh 'chmod +x gradlew && ./gradlew build -x test --no-daemon' }
                        sh "docker compose -f ${env.COMPOSE_FILE} --env-file .ci.env build backend-sp"
                        sh "docker compose -f ${env.COMPOSE_FILE} --env-file .ci.env push backend-sp"
                    } else if (env.ACTUAL_TARGET == 'ex') {
                        dir('exbackend') { sh 'npm install && npm run build' }
                        sh "docker compose -f ${env.COMPOSE_FILE} --env-file .ci.env build backend-ex"
                        sh "docker compose -f ${env.COMPOSE_FILE} --env-file .ci.env push backend-ex"
                    } else if (env.ACTUAL_TARGET == 'sfu') {
                        sh "docker compose -f ${env.SFU_COMPOSE_FILE} --env-file .ci.env build mediasoup"
                        sh "docker compose -f ${env.SFU_COMPOSE_FILE} --env-file .ci.env push mediasoup"
                    }

                    sh 'docker logout docker.io'
                }
            }
        }

        stage('Remote Deploy') {
            steps {
                script {
                    def serviceName
                    def infraServices

                    if (env.ACTUAL_TARGET == 'fe') {
                        serviceName = 'frontend'
                        infraServices = 'postgres redis nginx'
                    } else if (env.ACTUAL_TARGET == 'sp') {
                        serviceName = 'backend-sp'
                        infraServices = 'postgres redis nginx'
                    } else if (env.ACTUAL_TARGET == 'ex') {
                        serviceName = 'backend-ex'
                        infraServices = 'postgres redis nginx'
                    } else if (env.ACTUAL_TARGET == 'sfu') {
                        serviceName = 'mediasoup'
                        infraServices = 'nginx'
                    }

                    def composeCmd = "docker compose -p ${env.COMPOSE_PROJECT_NAME} -f ${env.ACTIVE_COMPOSE_FILE} --env-file .env --env-file .ci.env"

                    withCredentials([sshUserPrivateKey(credentialsId: env.DEPLOY_SSH_CRED, keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            ssh -i ${env.SSH_KEY} -o StrictHostKeyChecking=no ${env.DEPLOY_SSH_USER}@${env.DEPLOY_HOST} 'mkdir -p ${env.OPERATING_DIR}'

                            scp -i ${env.SSH_KEY} -o StrictHostKeyChecking=no .ci.env ${env.DEPLOY_SSH_USER}@${env.DEPLOY_HOST}:${env.OPERATING_DIR}/.ci.env
                            scp -i ${env.SSH_KEY} -o StrictHostKeyChecking=no ${env.ACTIVE_COMPOSE_FILE} ${env.DEPLOY_SSH_USER}@${env.DEPLOY_HOST}:${env.OPERATING_DIR}/${env.ACTIVE_COMPOSE_FILE}

                            ssh -i ${env.SSH_KEY} -o StrictHostKeyChecking=no ${env.DEPLOY_SSH_USER}@${env.DEPLOY_HOST} \\
                              "set -e && cd ${env.OPERATING_DIR} && \\
                               ${composeCmd} up -d ${infraServices} && \\
                               ${composeCmd} pull ${serviceName} && \\
                               ${composeCmd} up -d --no-deps --force-recreate ${serviceName} && \\
                               NGINX_ID=\\\$(docker ps -q -f name=${env.COMPOSE_PROJECT_NAME}-nginx-1) && \\
                               ( [ -z \\\"\\\$NGINX_ID\\\" ] || docker exec -T \\\"\\\$NGINX_ID\\\" nginx -s reload || true )"
                        """
                    }
                }
            }
        }

        stage('Health Check') {
            options { timeout(time: 3, unit: 'MINUTES') }
            steps {
                script {
                    def healthMap = [
                        fe : [url: 'http://localhost:3000', name: 'Frontend'],
                        sp : [url: 'http://localhost:8080', name: 'Backend-SP'],
                        ex : [url: 'http://localhost:3001', name: 'Backend-EX'],
                        sfu: [url: 'http://localhost:3001', name: 'SFU-Mediasoup'],
                    ]

                    def target = healthMap[env.ACTUAL_TARGET]
                    def maxRetry = 30
                    def interval = 5

                    echo "🔍 ${target.name} 헬스 체크 (${env.DEPLOY_HOST})"

                    def healthy = false
                    withCredentials([sshUserPrivateKey(credentialsId: env.DEPLOY_SSH_CRED, keyFileVariable: 'SSH_KEY')]) {
                        for (int i = 1; i <= maxRetry; i++) {
                            def status = sh(
                                returnStdout: true,
                                script: """
                                    ssh -i ${env.SSH_KEY} -o StrictHostKeyChecking=no ${env.DEPLOY_SSH_USER}@${env.DEPLOY_HOST} \\
                                      "curl -sL -o /dev/null -w '%{http_code}' ${target.url} || echo '000'"
                                """.trim()
                            ).trim()

                            if (status ==~ /2\d\d|302|404/) {
                                echo "✅ ${target.name} 헬스 체크 성공 (HTTP ${status})"
                                healthy = true
                                break
                            }

                            echo "⏳ 대기 중... (${i}/${maxRetry}) - HTTP ${status}"
                            sleep interval
                        }
                    }

                    if (!healthy) {
                        error("❌ ${target.name} 헬스 체크 실패 — ${env.DEPLOY_HOST}")
                    }
                }
            }
        }
    }

    post {
        always { sh 'docker image prune -f || true' }
        success {
            script {
                def targetType = env.ACTUAL_TARGET.toUpperCase()
                def host = env.DEPLOY_HOST ?: 'unknown'
                discordSend(
                    description: "🎉 ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    footer: "✅ ${targetType} 배포 성공 → ${host}",
                    link: env.BUILD_URL,
                    result: currentBuild.currentResult,
                    title: "Aurora ${targetType} Deploy",
                    webhookURL: env.DISCORD_WEBHOOK
                )
            }
        }
        failure {
            script {
                def targetType = env.ACTUAL_TARGET.toUpperCase()
                def host = env.DEPLOY_HOST ?: 'unknown'
                discordSend(
                    description: "💥 ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    footer: "❌ ${targetType} 배포 실패 → ${host}",
                    link: env.BUILD_URL,
                    result: currentBuild.currentResult,
                    title: "Aurora ${targetType} Deploy",
                    webhookURL: env.DISCORD_WEBHOOK
                )
            }
        }
    }
}
