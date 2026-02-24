import { AccessType } from "./AccessType";
import { ChannelKind } from "./ChannelKind";
import { ChannelRole } from "./ChannelRole";

export interface Channel {
  channelPk: number;
  channelName: string;
  channelKind: ChannelKind;
  accessType: AccessType;
  channelRole: ChannelRole;
}

export interface ChannelRequest {
  channelName: string;
  channelKind: ChannelKind;
  accessType: AccessType;
}

export interface LastChannelResponse {
  serverUrl: string;
  projectPk: number;
  channelPk: number
}