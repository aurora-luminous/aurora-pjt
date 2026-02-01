import { DtlsParameters, IceCandidate, IceParameters, RtpCapabilities, SctpParameters } from "mediasoup-client/types";
import { SfuEvent } from "./enums/SfuEvent";
import { Producer } from "./Producer";
import { MediaSourceType } from "./enums/MediaSourceType";

export type MediaKind = "audio" | "video";

export interface ProducerAppData {
    mediaType: MediaSourceType;
}

// 방 입장 이벤트
export interface joinRoomPayload {
    event: SfuEvent.JOIN_ROOM;
    channelPk: number;
    authToken: string;
    rtpCapabilities: RtpCapabilities;
}

// 방 입장 성공 이벤트
export interface joinRoomResponse {
    event: SfuEvent.JOIN_ROOM_SUCCESS;
    existingProducers: Producer[];
}

// SFU 라우터의 RTP Capabilities 요청 이벤트
export interface RtpCapabilitiesPayload {
    event: SfuEvent.GET_ROUTER_RTP_CAPS;
    channelPk: number;
}

// SFU 라우터의 RTP Capabilities 응답 이벤트
export interface RTpCapabilitiesResponse {
    event: SfuEvent.ROTUER_RTP_CAPS;
    rtpCapabilities: RtpCapabilities;
}

// Transport 생성 요청 이벤트
export interface CreateTransportPayload {
    event: SfuEvent.CREATE_TRANSPORT;
    channelPk: number;
}

// Transport 생성 응답 이벤트
export interface CreateTransportResponse {
    event: SfuEvent.TRANSPORT_CREATED;
    transportId: string;
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
    sctpParameters?: SctpParameters;
}

// Transport 연결 요청 이벤트
export interface ConnectTransportPayload {
    event: SfuEvent.CONNECT_TRANSPORT;
    channelPk: number;
    transportId: string;
    dtlsParameters: DtlsParameters;
}

// Transport 연결 응답 이벤트
export interface ConnectTransportResponse {
    event: SfuEvent.TRANSPORT_CONNECTED
    transportId: string;
}

// 미디어 송출 요청 이벤트
export interface ProducerPayload {
    event: SfuEvent.PRODUCE;
    channelPk: number;
    transpoartId: string;
    kind: MediaKind;
    rtpParameters: RtpCapabilities;
    appData: ProducerAppData;
}

// 미디어 송출 응답 이벤트
export interface ProducerResponse {
    event: SfuEvent.PRODUCED;
    producerId: string;
}

// 미디어 수신 요청 이벤트
export interface ConsumePayload {
    event: SfuEvent.CONSUME;
    channelPk: number;
    transportId: string;
    producerId: string;
    rtpCapabilities: RtpCapabilities;
}

// 미디어 수신 응답 이벤트
export interface ConsumeResponse {
    event: SfuEvent.CONSUMED;
    id: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpCapabilities;
    type: string;
    producerPaused: boolean;
    appData: ProducerAppData;
}

// 미디어 수신 재개 요청 이벤트
export interface ResumeConsumerPayload {
    event: SfuEvent.RESUME_CONSUMER;
    channelPk: number;
    consumerId: string;
}

// 미디어 수신 재개 응답 이벤트
export interface ResumeConsumerResponse {
    event: SfuEvent.RESUMED_CONSUMER;
    consumerId: string;
}

// 미디어 송출 종료 요청 이벤트
export interface ProducerClosedPayload {
    event: SfuEvent.PRODUCER_CLOSED;
    channelPk: number;
    producerId: string;
}

// 미디어 송출 종료 응답 이벤트
export interface ProducerClosedResponse {
    event: SfuEvent.PRODUCER_CLOSED;
    producerId: string;
}

// 피어 퇴장 요청 이벤트
export interface PeerLeftPayload {
    event: SfuEvent.PEER_LEFT;
    channelPk: number;
    userId: number;
}

// 송출자 목록 요청 이벤트
export interface GetProducersPayload {
    event: SfuEvent.GET_PRODUCERS;
    channelPk: number;
}

// 송출자 목록 응답 이벤트
export interface GetProducersResponse {
    event: SfuEvent.GET_PRODUCERS_RESPONSE;
    producers: Producer[];
}

// 피어 퇴장 응답 이벤트
export interface PeerLeftResponse {
    event: SfuEvent.PEER_LEFT;
    userId: number;
}

// 송출자 종료 요청 이벤트
export interface CloseProducerPayload {
    event: SfuEvent.CLOSE_PRODUCER;
    channelPk: number;
    producerId: string;
}

// 송출자 종료 응답 이벤트
export interface CloseProducerResponse {
    event: SfuEvent.PRODUCER_CLOSED;
    producerId: string;
}

// 새로운 송출자 생성 이벤트
export interface NewProducerResponse {
    event: SfuEvent.NEW_PRODUCER;
    produceId: string;
    producerKind: MediaKind;
    peerId: string;
}

// 피어 연결 끊김 응답 이벤트
export interface PeerDisconnectedResponse {
    event: SfuEvent.PEER_DISCONNECTED;
    clientId: string;
    userId: number;
}