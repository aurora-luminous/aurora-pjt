package com.luminous.aurora.project.entity;


import com.luminous.aurora.auth.entity.Users;
import com.luminous.aurora.channel.entity.Channel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_member_pk")
    private Integer projectMemberPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_pk", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk", nullable = false)
    private Users user;

    @Column(name = "p_status", nullable = false)
    private String pStatus;

    @Builder.Default
    @Column(name = "project_role", nullable = false)
    private String projectRole = "member";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_connected_channel")
    private Channel lastConnectedChannel;

    @Column(name = "last_connected_time")
    private LocalDateTime lastConnectedTime;

}
