import { MediaKind } from "mediasoup-client/types";

export interface Peer {
    id: string;
    stream: MediaStream;
    kind: MediaKind;
    userId: number;
    producerId: string;
    clientId: string;
}