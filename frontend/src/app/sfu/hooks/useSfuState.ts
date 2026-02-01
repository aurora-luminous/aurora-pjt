import { useState, useCallback } from "react";
import { Peer } from "../types/Peer";
import { MediaKind } from "../types/Producer";
import { MediaSourceType } from "../types/enums/MediaSourceType";

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export const useSfuState = () => {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");

    const addPeer = useCallback((peer: Peer) => {
        setPeers((prev) => [...prev, peer]);
    }, []);

    const removePeer = useCallback((userId: number) => {
        setPeers((prev) => prev.filter((p) => p.userId !== userId));
    }, []);

    const removePeerByProducerId = useCallback((producerId: string) => {
        setPeers((prev) => prev.filter((p) => p.producerId.toString() !== producerId));
    }, []);

    const clearPeers = useCallback(() => {
        setPeers([]);
    }, []);

    return {
        peers,
        setPeers,
        addPeer,
        removePeer,
        removePeerByProducerId,
        clearPeers,
        connectionStatus,
        setConnectionStatus
    };
};
