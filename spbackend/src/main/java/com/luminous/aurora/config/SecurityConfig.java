package com.luminous.aurora.config;


import com.luminous.aurora.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final InternalApiAuthFilter internalApiAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception{
        http
                .csrf(csrf -> csrf.disable()) // csrf 비활성화 (jwt 사용하기때문)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 사용 안함 -> jwt 로그인 방식이기 때문
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/").permitAll() // 루트경로 허용
                        .requestMatchers("/api/jv/login","/api/jv/signup","/api/jv/refresh").permitAll() // 인증관련 api 전부 허용
                        .requestMatchers("/api/jv/internal/**").permitAll() // 내부경로 허용
                        .requestMatchers("/ws/info").permitAll() // 웹소켓 연결을 위한 SockJS 허용
                        .requestMatchers("/ws/**").authenticated() // Websocket 연결은 인증
                        .anyRequest().authenticated()
                )
                .addFilterBefore(internalApiAuthFilter, JwtAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // localhost와 프론트엔드 도메인만 허용
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",      // Express 개발 서버
                "http://localhost:8080",      // Spring Boot 개발 서버
                "http://localhost:5173",      // React 개발 서버
                "https://auro-ra.site"    // 프로덕션 서버
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
