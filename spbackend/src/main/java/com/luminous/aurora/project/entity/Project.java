package com.luminous.aurora.project.entity;


import com.luminous.aurora.server.entity.Server;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer projectPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_pk")
    private Server server;

    private String projectName;
    private Boolean isDeletedProject;
}
