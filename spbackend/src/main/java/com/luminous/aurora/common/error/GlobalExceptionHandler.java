package com.luminous.aurora.common.error;

import com.luminous.aurora.common.error.exception.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // 400 BAD Request
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponseDto> handleBadRequestException(BadRequestException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                e.getMessage() != null ? e.getMessage() : "잘못된 요청입니다.",
                "BAD_REQUEST",
                HttpStatus.BAD_REQUEST.value()
        );

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // 401 Unauthorized
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDto> handleUnauthorizedException(UnauthorizedException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                e.getMessage() != null ? e.getMessage() : "인증에 실패했습니다.",
                "UNAUTHORIZED",
                HttpStatus.UNAUTHORIZED.value()
        );

        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    // 403 Forbidden
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponseDto> handleForbiddenException(ForbiddenException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                e.getMessage() != null ? e.getMessage() : "접근 권한이 없습니다.",
                "FORBIDDEN",
                HttpStatus.FORBIDDEN.value()
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    // 404 Not Found
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleNotFoundException(NotFoundException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                e.getMessage() != null ? e.getMessage() : "요청한 리소스를 찾을 수 없습니다.",
                "NOT_FOUND",
                HttpStatus.NOT_FOUND.value()
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    // 409 Conflict
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponseDto> handleConflictException(ConflictException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                e.getMessage() != null ? e.getMessage() : "리소스 충돌이 발생했습니다.",
                "CONFLICT",
                HttpStatus.CONFLICT.value()
        );
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    // 500 Internal Server Error
    @ExceptionHandler(InternalServerErrorException.class)
    public ResponseEntity<ErrorResponseDto> handleInternalServerErrorException(InternalServerErrorException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                e.getMessage() != null ? e.getMessage() : "서버 내부 오류가 발생했습니다.",
                "INTERNAL_SERVER_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // JPA 관련 오류 처리
    @ExceptionHandler(org.springframework.data.mapping.PropertyReferenceException.class)
    public ResponseEntity<ErrorResponseDto> handlePropertyReferenceException(org.springframework.data.mapping.PropertyReferenceException e) {
        ErrorResponseDto response = new ErrorResponseDto(
                "JPA 속성 참조 오류가 발생했습니다.",
                "PROPERTY_REFERENCE_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 처리되지 않은 모든 예외를 500 에러로 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleAllException(Exception e) {
        log.error("처리되지 않은 예외", e);
        ErrorResponseDto response = new ErrorResponseDto(
                "예상치 못한 오류가 발생했습니다.",
                "INTERNAL_SERVER_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Bean Validation 실패 시 (회원가입/로그인 등 @Valid 실패)
     * - 첫 번째 필드 에러 메시지 반환
     * - 400 Bad Request
     * - @Override만 사용 (부모 ResponseEntityExceptionHandler와 핸들러 중복 등록 시 Ambiguous 오류 방지)
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> fieldError.getDefaultMessage())
                .findFirst()
                .orElse("입력값이 올바르지 않습니다.");

        ErrorResponseDto response = new ErrorResponseDto(
                message,
                "BAD_REQUEST",
                HttpStatus.BAD_REQUEST.value()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}
