import { useCallback, useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { Consumer, Device, Producer, RtpCapabilities, Transport } from "mediasoup-client/types";

/**
 * 피어(Peer) 인터페이스 정의
 * - 다른 사용자의 미디어 스트림 정보를 담습니다.
 * - 'kind'는 원격에서 넘겨주는 appData.source에 따라 결정됩니다 (mic, camera, screen).
 */
export interface Peer {
    id: string;             // Consumer ID (고유값)
    userId: number;         // 사용자 ID
    stream: MediaStream;    // 실제 재생할 미디어 스트림
    kind: "mike" | "camera" | "screen" | string; // 미디어 종류
    producerId: number;     // 원격 Producer ID
}

interface ConnectSfuProps {
    channelId : number;     // 입장할 채널 ID
    accessToken: string;    // 인증 토큰
}

/**
 * SFU 서버와 연결하여 WebRTC 미디어 송수신을 관리하는 커스텀 훅
 */
export const useConnectSfu = ({channelId, accessToken}: ConnectSfuProps) => {
    // --- 상태 관리 ---
    // 현재 방에 참여 중인 다른 사용자의 미디어 스트림 목록
    const [peers, setPeers] = useState<Peer[]>([]);
    
    // SFU 서버와의 WebSocket 연결 상태
    const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting" | "error">("disconnected");

    // --- Refs (렌더링에 영향 주지 않는 변수들) ---
    // WebSocket 인스턴스
    const socketRef = useRef<WebSocket | null>(null);
    
    // Mediasoup Device 인스턴스 (하드웨어/코덱 능력 관리)
    const deviceRef = useRef<Device | null>(null);
    
    // 미디어 송신용 Transport (내 소리/화면 내보내기)
    const producerTransportRef = useRef<Transport | null>(null);
    
    // 미디어 수신용 Transport (다른 사람 소리/화면 받기)
    const consumerTransportRef = useRef<Transport | null>(null);

    // 내가 생성한 Producer들 저장소 (Key: "mike" | "camera" | "screen")
    const producerRef = useRef<Map<string, Producer>>(new Map()); 

    // 내가 수신 중인 Consumer들 저장소 (Key: Consumer ID)
    const consumerRef = useRef<Map<string, Consumer>>(new Map());

    // 방 입장 직후, 아직 Device 로드 전이라 대기 중인 기존 프로듀서 목록
    const tempExistingProducerRef = useRef<Producer[]>([]);

    // --- WebSocket 메시지 전송 헬퍼 함수 ---
    const send = useCallback((event: string, data: any) => {
        // 소켓이 열려있을 때만 데이터를 전송합니다.
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({event, ...data}));
        }
    }, []);

    // --- 1. WebSocket 연결 설정 ---
    useEffect(() => {
        if (!channelId || !accessToken) return;

        // WebSocket URL 설정 (환경 변수 또는 하드코딩)
        const wsUrl = process.env.NEXT_PUBLIC_WS_VOICE_URL; 
        if (!wsUrl) {
            throw new Error("WebSocket URL이 설정되지 않았습니다.");
        }
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;
        setConnectionStatus("connecting");

        // 연결 성공 시
        ws.onopen = () => {
            console.log("SFU: 웹 소켓 연결됨");
            setConnectionStatus("connected");

            // 1-1. 방 입장 요청 (join-room)
            // rtpCapabilities는 아직 Device 로드 전이므로 빈 객체로 보냅니다.
            send("join-room", {
                chnannelPk: channelId,
                authToken : accessToken,
                rtpCapabilities: {},
            });
        }

        // 메시지 수신 시
        ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                await handleMessage(message);
            } catch (error) {
                console.error("SFU: 소켓 메시지 파싱 실패 :", error);
            }
        }

        // 에러 발생 시
        ws.onerror = (error) => {
            console.error("SFU: 웹 소켓 오류:", error);
            setConnectionStatus("error");
        }

        // 연결 종료 시
        ws.onclose = () => {
            console.log("SFU: 웹 소켓 종료");
            setConnectionStatus("disconnected");
            cleanUp(); // 자원 정리
        }

        // 컴포넌트 언마운트 시 정리 (클린업)
        return () => {
            ws.close();
            cleanUp();
        }
    }, [channelId, accessToken, send]);

    // --- 2. WebSocket 메시지 핸들러 ---
    const handleMessage = async (message: any) => {
        const {event, ...data} = message;
        
        switch (event) {
                // 방 입장 성공
                case "joinRoomSuccess" :
                    // 기존에 있던 프로듀서 목록을 잠깐 저장해둠 (Device 로드 후 소비해야 함)
                    tempExistingProducerRef.current = data.existingProducers || [];
                    
                    // 서버에 "너희 서버 라우터 능력 좀 알려줘" 요청
                    send("get-router-rtp-capabilities", {channelPk: channelId});
                    break;
                
                // 서버 라우터 능력치 수신 -> 내 Device 로드 시작
                case "router-rtp-capabilities" :
                    await loadDevice(data.rtpCapabilities);
                    break;
                
                // Transport 생성 완료 (createTransports 내부 리스너에서 처리되지만 혹시 몰라 남겨둠)
                case "webrtc-transport-created":
                    break;
                
                // Transport 연결 성공
                case "transport-connected":
                    console.log("SFU: Transport 연결됨");
                    break;
                
                // 내 미디어 송출 성공
                case "produced":
                    break;
                
                // 누군가 새로운 미디어를 켰을 때 (New Producer)
                case "new-producer":
                    console.log("SFU: 새로운 프로듀서 발견:", data.producerId);
                    // 그 미디어를 내가 소비(Consume)하겠다고 요청
                    await consumeMedia(data);
                    break;
                
                // 미디어 소비 준비 완료 (Consume 성공)
                case "consumed":
                    // 실제 Consumer 객체 생성 및 스트림 연결
                    await handleNewConsumer(data);
                    break;
                
                // 누군가 나갔을 때
                case "peer-left":
                    removePeer(data.userId);
                    break;
                
                // 누군가 미디어를 껐을 때
                case "producer-closed":
                    closeConsumer(data.producerId);
                    break;
                
                // 서버 에러
                case "error":
                    console.error("SFU: 서버 에러 발생:", data.message);
                    break;
        }
    }

    // --- 3. Mediasoup Device 로드 ---
    const loadDevice = async (routerRtpCapabilities: RtpCapabilities) => {
        try {
            const device = new mediasoupClient.Device();
            // 서버의 코덱 정보 등을 바탕으로 Device 로드
            await device.load({routerRtpCapabilities});
            deviceRef.current = device;

            // 송수신용 Transport (연결 통로) 생성
            await createTransports();

            // 대기 중이던 기존 사용자들의 미디어 소비 시작
            const existingProducers = tempExistingProducerRef.current;
            for (const producerInfo of existingProducers) {
                await consumeMedia(producerInfo);
            }
            tempExistingProducerRef.current = []; // 초기화
        } catch (error) {
            console.error("SFU: 디바이스 로드 실패:", error);
        }
    }

    // --- 4. Send/Recv Transport 생성 ---
    const createTransports = async () => {
        const device = deviceRef.current;
        if (!device) return;

        // Transport 생성을 위한 내부 헬퍼 함수
        const createTransportPromise = (isProducer: boolean) => {
            return new Promise<void>((resolve, reject) => {
                // 서버에 Transport 생성 요청
                send("create-webrtc-transport", {channelPk: channelId});

                // 생성 응답 대기
                const onMessage = (e: MessageEvent) => {
                    const msg = JSON.parse(e.data);
                    if (msg.event === "webrtc-transport-created") {
                        socketRef.current?.removeEventListener("message", onMessage);
                        try {
                            // Mediasoup Device를 이용해 클라이언트 측 Transport 객체 생성
                            const transport = isProducer 
                                ? device.createSendTransport(msg) 
                                : device.createRecvTransport(msg);
                            
                            // 'connect' 이벤트: DTLS 파라미터를 서버에 전송하여 연결 수립
                            transport.on("connect", ({dtlsParameters}, callback, errback) => {
                                send("connect-transport", {
                                    transportId: transport.id,
                                    dtlsParameters,
                                    channelPk: channelId
                                });
                                callback();
                            });

                            // 'produce' 이벤트: (Producer Transport만 해당) 미디어 송출 시작 시 발생
                            if (isProducer) {
                                transport.on("produce", async({kind, rtpParameters, appData}, callback, errback) => {
                                    send("produce", {
                                        transportId: transport.id,
                                        kind,
                                        rtpParameters,
                                        appData, // 여기에 source 정보가 들어있음
                                        channelPk: channelId
                                    });

                                    // 서버에서 "생성 완료(produced)" 응답이 올 때까지 대기
                                    const onProduced = (ev: MessageEvent) => {
                                        const msg = JSON.parse(ev.data);
                                        if (msg.event === "produced") {
                                            socketRef.current?.removeEventListener("message", onProduced);
                                            // 성공 시 ID를 콜백으로 넘겨줌
                                            callback({id: msg.producerId});
                                        }
                                    }
                                    socketRef.current?.addEventListener("message", onProduced);
                                });
                                producerTransportRef.current = transport;
                            } else {
                                consumerTransportRef.current = transport;
                            }
                            resolve();
                        }catch(e) {
                            reject(e);
                        }
                    }
                }

                socketRef.current?.addEventListener("message", onMessage);
            })
        };

        // Producer(송신), Consumer(수신) Transport 각각 생성
        await createTransportPromise(true);
        await createTransportPromise(false);
    };

    // --- 5. 미디어 송출 (Produce) ---
    // track: 실제 비디오/오디오 트랙
    // source: "mike", "camera", "screen" 구분 태그
    const produce = async (track: MediaStreamTrack, source: "mike" | "camera" | "screen" ) => {
        if (!producerTransportRef.current) return;

        // 이미 같은 source의 producer가 있다면 중복 생성 방지
        if (producerRef.current.has(source)) return;

        try {
            // appData에 source 정보를 담아서 서버로 전송
            // 이 정보는 다른 클라이언트가 "이게 무슨 스트림인지" 알게 해줌
            const producer = await producerTransportRef.current.produce({ 
                track, 
                appData: { source : source } 
            });
            
            // Map에 저장 (나중에 끄기 위해 관리)
            producerRef.current.set(source, producer);

            // 트랙이 끝나면(예: 화면공유 중지 등) 정리
            producer.on("trackended", () => {
                stopProduce(source);
            });

            producer.on("transportclose", () => {
                producerRef.current.delete(source);
            })
        } catch (error) {
            console.error("SFU: 프로듀서 생성 실패:", error);
        }
    };

    // --- 6. 미디어 송출 중단 (Stop Produce) ---
    const stopProduce = (source: "mike" | "camera" | "screen") => {
        const producer = producerRef.current.get(source);
        if (producer) {
            producer.close(); // 로컬 Mediasoup Producer 닫기
            // 서버에도 알림
            send("close-producer", {channelPk: channelId, producerId: producer.id});
            producerRef.current.delete(source); // Map에서 제거
        }
    };

    // --- 7. 미디어 수신 요청 (Consume Media) ---
    // 다른 사람의 미디어를 받겠다고 서버에 요청
    const consumeMedia = async (producerInfo: any) => {
        if (!consumerTransportRef.current || !deviceRef.current) return;
        const {producerId} = producerInfo;

        // 내 Device 능력(RtpCapabilities)을 서버에 같이 보냄
        send("consume", {
            transportId: consumerTransportRef.current.id,
            producerId,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
            channelPk: channelId
        });
    };

    // --- 8. 새로운 Consumer 처리 (Handle New Consumer) ---
    // 서버로부터 소비 승인이 떨어지면 실제 Consumer 객체를 생성
    const handleNewConsumer = async (data: any) => {
        if (!consumerTransportRef.current) return;

        const {id, producerId, kind, rtpParameters, appData} = data;

        try {
            // Mediasoup Client Consumer 생성
            const consumer = await consumerTransportRef.current.consume({
                id,
                producerId,
                kind,
                rtpParameters,
            });
            
            // Map에 저장
            consumerRef.current.set(consumer.id, consumer);
            
            // 스트림 생성 (이게 <video>나 <audio>에 들어갈 객체)
            const stream = new MediaStream([consumer.track]);

            // 상태 업데이트 -> UI에 반영
            setPeers((prev) => [
                ...prev,
                {
                    id : consumer.id,
                    userId : data.userId, // 서버가 보내준 유저 정보
                    stream,
                    // 서버가 appData.source를 보내준다면 그걸 우선 사용, 없다면 기본 kind 사용
                    kind: (appData && appData.source) ? appData.source : kind, 
                    producerId,
                },
            ]);
        } catch (error) {
            console.error("SFU: Consumer 생성 실패:", error);
        }
    }

    // --- 9. 사용자 퇴장 처리 ---
    const removePeer = (userId: any) => {
        setPeers((prev) => {
            const remaining: Peer[] = [];
            prev.forEach((p) => {
                // 해당 유저의 스트림인 경우
                if (p.userId == userId) {
                    const consumer = consumerRef.current.get(p.id);
                    if (consumer) {
                        consumer.close(); // Consumer 리소스 해제
                        consumerRef.current.delete(p.id); // Map에서 제거
                    }
                } else {
                    // 다른 유저의 스트림은 유지
                    remaining.push(p);
                }
            })
            return remaining;
        })
    }

    // --- 10. 특정 미디어 종료 처리 ---
    // 사용자가 캠만 껐을 때 등에 대응
    const closeConsumer = (producerId: number) => {
        setPeers((prev) => {
            // 닫힌 Producer ID를 가진 Peer 찾기
            const target = prev.find(p => p.producerId === producerId);
            if (target) {
                const consumer = consumerRef.current.get(target.id);
                if (consumer) {
                    consumer.close(); // 리소스 해제
                    consumerRef.current.delete(target.id);
                }
                // 목록에서 제거
                return prev.filter(p => p.producerId !== producerId);
            }
            return prev;
        })
    };

    // --- 11. 전체 정리 (Clean Up) ---
    const cleanUp = () => {
        // 모든 Producer 종료
        producerRef.current.forEach(p => p.close());
        producerRef.current.clear();
        
        // 모든 Consumer 종료
        consumerRef.current.forEach(c => c.close());
        consumerRef.current.clear();
        
        // Transports 종료
        if (producerTransportRef.current) producerTransportRef.current.close();
        if (consumerTransportRef.current) consumerTransportRef.current.close();

        // 상태 초기화
        setPeers([]);
    }

    return {
        peers,
        connectionStatus,
        produce,
        stopProduce
    }

}