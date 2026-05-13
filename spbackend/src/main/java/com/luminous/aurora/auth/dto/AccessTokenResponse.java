package com.luminous.aurora.auth.dto;


import lombok.*;


/**
 * 로그인/리프레시 응답 body에 담기는 access token 페이로드.
 * <p>
 * 클라이언트는 이 토큰을 메모리(상태 관리 스토어 등)에 보관하고,
 * 인증이 필요한 모든 REST 요청에 {@code Authorization: Bearer <accessToken>}
 * 헤더로 첨부한다.
 * <p>
 * refresh token은 보안상 응답 body에 노출하지 않으며,
 * 별도의 HttpOnly Cookie로만 전달된다 (#225).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessTokenResponse {
    private String accessToken;
}
