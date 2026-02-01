import { useRef, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { Device, Transport, Producer, Consumer, RtpCapabilities } from "mediasoup-client/types";
import { MediaSourceType } from "../types/enums/MediaSourceType";
import { Peer } from "../types/Peer";

interface UseSfuClientProps {
    channelId: number;
    send: (event: string, data: any) => void;
    addPeer: (peer: Peer) => void;
    removePeer: (userId: number) => void;
    removePeerByProducerId: (producerId: string) => void;
}

export const useSfuClient = ({ 
    channelId, 
    send, 
    addPeer,
    removePeer,
    removePeerByProducerId
}: UseSfuClientProps) => {
    // Refs
    const deviceRef = useRef<Device | null>(null);
    const producerTransportRef = useRef<Transport | null>(null);
    const consumerTransportRef = useRef<Transport | null>(null);
    const producersRef = useRef<Map<string, Producer>>(new Map()); // Key: MediaSourceType
    const consumersRef = useRef<Map<string, Consumer>>(new Map()); // Key: Consumer ID
    const tempExistingProducersRef = useRef<any[]>([]); // Device 로드 전 대기열

    // --- 1. Device Load ---
    const loadDevice = async (routerRtpCapabilities: RtpCapabilities) => {
        try {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities });
            deviceRef.current = device;
            
            // Device 로드 후 Transport 생성
            await createTransports();

            // 대기 중이던 기존 Producer들 Consume 시작
            const existing = tempExistingProducersRef.current;
            for (const producerInfo of existing) {
                await consumeMedia(producerInfo);
            }
            tempExistingProducersRef.current = [];

        } catch (error) {
            console.error("SFU: Failed to load device", error);
        }
    };

    // --- 2. Create Transports ---
    const createTransports = async () => {
        const device = deviceRef.current;
        if (!device) return;

        // Helper: Producer용 / Consumer용 Transport 생성 요청
        const createTransportPromise = (isProducer: boolean) => {
            return new Promise<void>((resolve, reject) => {
                send("create-webrtc-transport", { channelPk: channelId });

                // 소켓으로부터 응답을 기다리는 로직은 Main Hook(useConnectSfu)의 onMessage에서
                // 'webrtc-transport-created' 이벤트를 받아서 아래 resolveTransport 함수를 호출하는 식으로 연결 필요
                // 하지만 여기서는 편의상 Promise Resolver를 반환하거나, 
                // 구조상 Main Hook에서 메시지 라우팅을 해줘야 함.
                
                // 리팩토링 구조상:
                // Main Hook이 메시지를 받으면 -> useSfuClient.handleTransportCreated()를 호출해줘야 함.
                // 따라서 여기서는 요청만 보내고, 실제 생성 로직은 별도 핸들러 함수로 분리합니다.
                resolve(); 
            });
        };

        // 요청 전송
        await createTransportPromise(true);
        await createTransportPromise(false);
    };

    // 서버로부터 Transport 생성 정보를 받았을 때 호출되는 함수
    const handleTransportCreated = async (data: any, isProducer: boolean) => {
        const device = deviceRef.current;
        if (!device) return;

        try {
            const transport = isProducer
                ? device.createSendTransport(data)
                : device.createRecvTransport(data);

            // Connect 이벤트
            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
                send("connect-transport", {
                    transportId: transport.id,
                    dtlsParameters,
                    channelPk: channelId
                });
                callback();
            });

            // Produce 이벤트 (Producer Transport만)
            if (isProducer) {
                transport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
                    send("produce", {
                        transportId: transport.id,
                        channelPk: channelId,
                        kind,
                        rtpParameters,
                        appData
                    });

                    // ID 수신 대기 로직은 복잡하므로, 
                    // Main Hook에서 'produced' 메시지 수신 시 처리할 수 있도록 
                    // callback을 임시 저장하거나, 소켓 핸들러를 동적으로 등록해야 함.
                    // 간단한 해결책: window/global event 또는 커스텀 이벤트 버스 사용
                    // 여기서는 Main Hook과의 결합도를 낮추기 위해, 
                    // produce 요청 시 pendingCallbackMap에 저장해두는 방식을 권장.
                    
                    // (임시) 전역 Map 등을 사용하여 콜백 저장 (Production 레벨에서는 더 정교한 큐 필요)
                    (window as any).__pendingProduceCallback = callback;
                });
                producerTransportRef.current = transport;
            } else {
                consumerTransportRef.current = transport;
            }

        } catch (error) {
            console.error("SFU: Transport creation failed", error);
        }
    };

    // Produced 성공 시 콜백 실행 (Main Hook에서 호출)
    const handleProduced = (producerId: string) => {
        if ((window as any).__pendingProduceCallback) {
            (window as any).__pendingProduceCallback({ id: producerId });
            delete (window as any).__pendingProduceCallback;
        }
    };

    // --- 3. Produce (Media Send) ---
    const produce = async (track: MediaStreamTrack, source: MediaSourceType) => {
        if (!producerTransportRef.current) return;
        if (producersRef.current.has(source)) return;

        try {
            const producer = await producerTransportRef.current.produce({
                track,
                appData: { mediaType: source } // Server expects mediaType or source? Check server code.
                // appData: { source } // 이전 코드 기준
            });

            producersRef.current.set(source, producer);

            producer.on("trackended", () => {
                stopProduce(source);
            });
            producer.on("transportclose", () => {
                producersRef.current.delete(source);
            });

        } catch (error) {
            console.error("SFU: Produce failed", error);
        }
    };

    const stopProduce = (source: MediaSourceType) => {
        const producer = producersRef.current.get(source);
        if (producer) {
            producer.close();
            send("close-producer", { channelPk: channelId, producerId: producer.id });
            producersRef.current.delete(source);
        }
    };

    // --- 4. Consume (Media Receive) ---
    const consumeMedia = async (producerInfo: any) => {
        // Consumer Transport가 아직 없으면 대기열에 넣거나 재시도 로직 필요
        // 여기서는 Device가 준비되었는지 확인
        if (!deviceRef.current || !consumerTransportRef.current) {
            // console.warn("SFU: Device not ready during consume request");
            return;
        }

        const { producerId } = producerInfo;
        send("consume", {
            transportId: consumerTransportRef.current.id,
            producerId,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
            channelPk: channelId
        });
    };

    // Consumed 이벤트 수신 시 (실제 수신 시작)
    const handleConsumed = async (data: any) => {
        if (!consumerTransportRef.current) return;

        const { id, producerId, kind, rtpParameters, appData, userId } = data;

        try {
            const consumer = await consumerTransportRef.current.consume({
                id,
                producerId,
                kind,
                rtpParameters
            });
            
            consumersRef.current.set(consumer.id, consumer);

            const stream = new MediaStream([consumer.track]);
            
            // Peer 추가 (State Hook 사용)
            addPeer({
                id: consumer.id,
                userId: userId, // Server provided userId
                stream: stream,
                kind: (appData && appData.source) ? appData.source : kind, // source check
                producerId: producerId,
                clientId: "" // 필요 시 채움
            });

        } catch (error) {
            console.error("SFU: Consume failed", error);
        }
    };

    // --- 5. Cleanup ---
    const cleanup = () => {
        producersRef.current.forEach(p => p.close());
        producersRef.current.clear();
        consumersRef.current.forEach(c => c.close());
        consumersRef.current.clear();
        
        if (producerTransportRef.current) producerTransportRef.current.close();
        if (consumerTransportRef.current) consumerTransportRef.current.close();
    };

    return {
        deviceRef,
        producersRef,
        tempExistingProducersRef,
        loadDevice,
        handleTransportCreated,
        handleProduced,
        handleConsumed,
        produce,
        stopProduce,
        consumeMedia,
        cleanup
    };
};
