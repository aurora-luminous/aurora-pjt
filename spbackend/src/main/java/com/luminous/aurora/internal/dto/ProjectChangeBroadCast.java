package com.luminous.aurora.internal.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Spring -> frontend 발신 dto
public class ProjectChangeBroadCast {
    private String eventType; // "PROJECT_ADDED" | "PROJECT_REMOVED" | "PROJECT_UPDATED"
    private Integer projectPk;
    private String projectName;
}
