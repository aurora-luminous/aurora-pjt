import { useParams } from "next/navigation";
import { channelNames } from "../../../../../constants/channelData";

export const useVoiceChannelParams = () => {
  const params = useParams();
  const serverId = params.server_id as string;
  const projectId = params.project_id as string;
  const channelId = params.channel_id as string;

  // 채널 이름 가져오기
  const getChannelName = (id: string) => {
    return channelNames[id] || id;
  };

  return {
    serverId,
    projectId,
    channelId,
    getChannelName,
  };
};
