import { expressClient } from "@/app/lib/axiosClient";
import type { Channel } from "@/app/(server-setup)/types";

export const getChannelListApi = (
  serverUrl: string,
  projectPk: number
): Promise<Channel[]> =>
  expressClient
    .get(`/ex/servers/${serverUrl}/projects/${projectPk}/channels`)
    .then((res) => res.data || []);
