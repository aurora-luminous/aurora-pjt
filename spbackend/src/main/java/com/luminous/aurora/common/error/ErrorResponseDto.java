package com.luminous.aurora.common.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ErrorResponseDto {
    private final String message;
    private final String Code;
    private final int status;
}
