package com.luminous.aurora.channel.entity;

import com.luminous.aurora.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer channelPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_pk")
    private Project project;
    private String channelName;
    private String channelKind;
    private Boolean isPrivate;
    private Boolean isDeletedChannel;

}
