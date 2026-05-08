pipeline {
    agent any
    options { 
        timestamps()
    }

    parameters {
        // 수동 빌드 시 선택하는 용도
        choice(name: 'DEPLOY_TARGET', choices: ['fe', 'sp', 'ex'], description: '배포할 대상을 선택하세요. (자동 배포 시에는 브랜치명에 따라 자동 결정됩니다.)')
        string(name: 'TAG', defaultValue: '', description: '커스텀 태그 (비워두면 자동 생성)')
    }

    environment {
        COMPOSE_PROJECT_NAME = 'aurora'
        COMPOSE_FILE = 'docker-compose.yml'
        OPERATING_DIR = '/home/ubuntu/aurora'
        
        FE_IMAGE_REPO = 'docker.io/shimkwkr/aurora-frontend'
        SP_IMAGE_REPO = 'docker.io/shimkwkr/aurora-backend-sp'
        EX_IMAGE_REPO = 'docker.io/shimkwkr/aurora-backend-ex'

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
                script {
                    // SCM 설정에 따라 현재 트리거된 브랜치를 체크아웃합니다.
                    checkout scm
                }
            }
        }

        stage('Prepare & Compute TAGs') {
            steps {
                script {
                    // 1. 배포 타겟 자동 결정 (Webhook vs 수동)
                    def branchName = env.GIT_BRANCH ?: ""
                    echo "검출된 브랜치: ${branchName}"

                    if (branchName.contains('sp')) {
                        env.ACTUAL_TARGET = 'sp'
                    } else if (branchName.contains('fe')) {
                        env.ACTUAL_TARGET = 'fe'
                    } else if (branchName.contains('ex')) {
                        env.ACTUAL_TARGET = 'ex'
                    } else {
                        // 브랜치 판별이 안 될 경우 파라미터 값 사용
                        env.ACTUAL_TARGET = params.DEPLOY_TARGET
                    }
                    echo "최종 결정된 배포 타겟: ${env.ACTUAL_TARGET}"

                    // 2. 태그 계산
                    def dateTag = sh(returnStdout: true, script: 'date +%Y%m%d-%H%M%S').trim()
                    env.FINAL_TAG = params.TAG ?: "${dateTag}-${BUILD_NUMBER}"

                    // 3. 임시 env 파일 작성
                    writeFile file: '.ci.env', text: """
TAG=${env.FINAL_TAG}
FE_IMAGE_REPO=${env.FE_IMAGE_REPO}
SP_IMAGE_REPO=${env.SP_IMAGE_REPO}
EX_IMAGE_REPO=${env.EX_IMAGE_REPO}
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
                    
                    // ACTUAL_TARGET에 따라 빌드 수행
                    if (env.ACTUAL_TARGET == 'fe') {
                        dir('frontend') { sh "npm install && npm run build -- --no-lint" }
                        sh "docker compose --env-file .ci.env build frontend"
                        sh "docker compose --env-file .ci.env push frontend"
                    } else if (env.ACTUAL_TARGET == 'sp') {
                        dir('spbackend') { sh "chmod +x gradlew && ./gradlew build -x test --no-daemon" }
                        sh "docker compose --env-file .ci.env build backend-sp"
                        sh "docker compose --env-file .ci.env push backend-sp"
                    } else if (env.ACTUAL_TARGET == 'ex') {
                        dir('exbackend') { sh "npm install && npm run build" }
                        sh "docker compose --env-file .ci.env build backend-ex"
                        sh "docker compose --env-file .ci.env push backend-ex"
                    }
                    
                    sh "docker logout docker.io"
                }
            }
        }

        stage('Remote Deploy') {
            steps {
                script {
                    def serviceName = (env.ACTUAL_TARGET == 'fe') ? 'frontend' : "backend-${env.ACTUAL_TARGET}"
                    
                    sh """
		                    # 1. 파일 복사
                        cp .ci.env ${env.OPERATING_DIR}/.ci.env
                        cp ${env.COMPOSE_FILE} ${env.OPERATING_DIR}/${env.COMPOSE_FILE}
                        
                        # 2. 이동 및 배포
                        cd ${env.OPERATING_DIR}
                        docker compose -p ${env.COMPOSE_PROJECT_NAME} --env-file .env --env-file .ci.env up -d postgres redis nginx
                        docker compose -p ${env.COMPOSE_PROJECT_NAME} --env-file .env --env-file .ci.env pull ${serviceName}
                        docker compose -p ${env.COMPOSE_PROJECT_NAME} --env-file .env --env-file .ci.env up -d --no-deps --force-recreate ${serviceName}

												# 3. Nginx Reload	
                        NGINX_ID=\$(docker ps -q -f name=${env.COMPOSE_PROJECT_NAME}-nginx-1)
                        if [ -n "\$NGINX_ID" ]; then
                            docker exec -T "\$NGINX_ID" nginx -s reload || true
                        fi
                    """
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
                    ]

                    def target = healthMap[env.ACTUAL_TARGET]
                    def maxRetry = 30
                    def interval = 5

                    echo "🔍 ${target.name} 헬스 체크 시작 (최대 ${maxRetry * interval}초)"

                    def healthy = false
                    for (int i = 1; i <= maxRetry; i++) {
                        def status = sh(
                            returnStdout: true,
                            script: "curl -sL -o /dev/null -w '%{http_code}' ${target.url} || echo '000'"
                        ).trim()

                        if (status ==~ /2\d\d|302|404/) {
                            echo "✅ ${target.name} 헬스 체크 성공 (HTTP ${status})"
                            healthy = true
                            break
                        }

                        echo "⏳ 대기 중... (${i}/${maxRetry}) - HTTP ${status}"
                        sleep interval
                    }

                    if (!healthy) {
                        error("❌ ${target.name} 헬스 체크 실패 — ${maxRetry * interval}초 내 응답 없음")
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
                discordSend(
                    description: "🎉 ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    footer: "✅ ${targetType} 배포 성공",
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
                discordSend(
                    description: "💥 ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    footer: "❌ ${targetType} 배포 실패",
                    link: env.BUILD_URL,
                    result: currentBuild.currentResult,
                    title: "Aurora ${targetType} Deploy",
                    webhookURL: env.DISCORD_WEBHOOK
                )
            }
        }
    }
}