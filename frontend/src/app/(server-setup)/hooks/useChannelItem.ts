import { useRouter } from "next/navigation";
import { useChannelFlow } from "@/app/(server-setup)/hooks/useChannelFlow";
import type { Channel } from "@/app/(server-setup)/types";

interface UseChannelItemProps {
  serverUrl: string;
  serverId: string;
  projectPk: number;
  channel: Channel
}

export const useChannelItem = ({
  serverUrl,
  serverId,
  projectPk,
  channel,
}: UseChannelItemProps) => {
  const router = useRouter();
  
  const { handleLeaveChannel: leaveChannel } = useChannelFlow(
    serverUrl,
    projectPk,
    channel.channelPk
  );

  const onLeaveChannel = async (userEmail: string) => {
    if (!confirm(`${channel.channelName} 채널에서 나가시겠습니까?`)) return;

    try {
      await leaveChannel(userEmail);
      
      // 현재 채널에서 나가는 경우 서버/프로젝트 메인으로 이동
      // (이 로직은 Component 레벨에서 isActive를 체크해서 처리하는 것이 더 정확할 수 있습니다)
    } catch (error) {
      alert("채널 나가기에 실패했습니다.");
    }
  };

  return {
    onLeaveChannel,
  };
};
