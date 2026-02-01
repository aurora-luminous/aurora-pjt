import { RtpCapabilities } from "mediasoup-client/types";
import { MediaSourceType } from "./enums/MediaSourceType";
import { SfuEvent } from "./enums/SfuEvent";

export type MediaKind = "audio" | "video";

export interface ProducerAppData {
    mediaType: MediaSourceType;
}

export interface ProducerPayload {
    event: SfuEvent.PRODUCE;
    channelPk: number;
    transpoartId: string;
    kind: MediaKind;
    rtpParameters: RtpCapabilities;
    appData: ProducerAppData;
}

export interface ProducerResponse {
    event: SfuEvent.PRODUCED;
    producerId: string;
}

export interface Producer {
    producerId: string;
    userId: number;
    kind: MediaKind;
    paused: boolean
    rtpParameters: RtpCapabilities;
    appData: ProducerAppData;
}