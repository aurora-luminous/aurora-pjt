import { useConnectRedux } from "./useConnectRedux";
import { useVoiceChannelParams } from "./useVoiceChannelParams";

export const useLoadRedux = () => {
  const { channelId } = useVoiceChannelParams();
  const reduxData = useConnectRedux(channelId);

  return {
    channelId,
    ...reduxData,
  };
};
