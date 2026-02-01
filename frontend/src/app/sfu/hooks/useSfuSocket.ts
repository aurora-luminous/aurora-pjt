import { useRef, useEffect, useCallback } from "react";

interface UseSfuSocketProps {
    url?: string;
    onOpen?: () => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
}

export const useSfuSocket = ({ 
    url = "ws://localhost:3002/voice",
    onOpen,
    onMessage,
    onError,
    onClose 
}: UseSfuSocketProps) => {
    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current) return;

        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("SFU: WebSocket Connected");
            if (onOpen) onOpen();
        };

        ws.onmessage = (event) => {
            if (onMessage) onMessage(event);
        };

        ws.onerror = (error) => {
            console.error("SFU: WebSocket Error", error);
            if (onError) onError(error);
        };

        ws.onclose = () => {
            console.log("SFU: WebSocket Closed");
            if (onClose) onClose();
            socketRef.current = null;
        };
    }, [url, onOpen, onMessage, onError, onClose]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    }, []);

    const send = useCallback((event: string, data: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ event, ...data }));
        } else {
            console.warn("SFU: Socket not open, cannot send", event);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    return {
        socketRef,
        connect,
        disconnect,
        send
    };
};
