import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class ChannelValidationService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  /**
   * SFU 서버에서 음성/화상 채널의 유효성을 검증하고 종류를 반환합니다.
   * @param channelPk - 검증할 채널의 기본키
   * @returns { isValid: boolean; channelKind?: 'TEXT' | 'VOICE' | 'VIDEO' }
   */
  async validateChannelKind(
    channelPk: number,
  ): Promise<{ isValid: boolean; channelKind?: 'TEXT' | 'VOICE' | 'VIDEO' }> {
    const channel = await this.channelRepository.findOne({
      where: { channelPk, isDeletedChannel: false },
    });

    if (!channel) {
      return { isValid: false };
    }

    // VOICE 또는 VIDEO 채널만 유효한 것으로 간주
    const isValid = channel.channelKind === 'VOICE' || channel.channelKind === 'VIDEO';

    return { isValid, channelKind: channel.channelKind };
  }
}
