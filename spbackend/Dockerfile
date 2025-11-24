# 1) Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Gradle 캐시 살리기
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies

# 소스 빌드
COPY src ./src
RUN ./gradlew --no-daemon -x test bootJar

# 2) Run stage (slim)
FROM eclipse-temurin:17-jre
WORKDIR /app

# 비루트 유저로 실행 (보안)
RUN useradd -ms /bin/bash spring && chown -R spring:spring /app
USER spring

# 산출물 복사
COPY --from=build /app/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
