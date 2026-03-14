package com.luminous.aurora.internal.dto;

import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Express -> Spring 수신 dto
public class ProjectChangeEvent {
    private String eventType; // "PROJECT_ADDED" | "PROJECT_REMOVED" | "PROJECT_UPDATE"
    private Integer projectPk;
    private String projectName;
    private String serverUrl;
}
