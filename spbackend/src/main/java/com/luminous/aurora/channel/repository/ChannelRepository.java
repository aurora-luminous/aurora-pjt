package com.luminous.aurora.channel.repository;

import com.luminous.aurora.channel.entity.Channel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChannelRepository extends JpaRepository<Channel, Integer> {
}
