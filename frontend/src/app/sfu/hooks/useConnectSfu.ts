import { useEffect } from "react";
import { useSfuState } from "./useSfuState";
import { useSfuSocket } from "./useSfuSocket";
import { useSfuClient } from "./useSfuClient";
import { MediaSourceType } from "../types/enums/MediaSourceType";

interface ConnectSfuProps {
    channelId: number;
    accessToken: string;
}

export const useConnectSfu = ({ channelId, accessToken }: ConnectSfuProps) => {
    // 1. 상태 관리
    const { 
        peers, 
        addPeer, 
        removePeer, 
        removePeerByProducerId, 
        clearPeers, 
        connectionStatus, 
        setConnectionStatus 
    } = useSfuState();

    // 2. 소켓 관리
    const { socketRef, connect, disconnect, send } = useSfuSocket({
        onOpen: () => {
            setConnectionStatus("connected");
            // 방 입장 요청
            send("join-room", {
                channelPk: channelId, // channelId or channelPk? Server check needed.
                authToken: accessToken,
                rtpCapabilities: {},
            });
        },
        onError: () => setConnectionStatus("error"),
        onClose: () => {
            setConnectionStatus("disconnected");
            clientCleanup();
            clearPeers();
        }
    });

    // 3. Mediasoup 클라이언트 로직
    const {
        loadDevice,
        handleTransportCreated,
        handleProduced,
        handleConsumed,
        produce,
        stopProduce,
        consumeMedia,
        cleanup: clientCleanup,
        tempExistingProducersRef
    } = useSfuClient({
        channelId,
        send,
        addPeer,
        removePeer,
        removePeerByProducerId
    });

    // 4. 소켓 메시지 처리
    // 소켓 이벤트 핸들러를 동적으로 연결하기 위해 useEffect 사용
    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                const { event: evtName, ...data } = message;

                switch (evtName) {
                    case "joinRoomSuccess":
                        // 기존 프로듀서 대기열 저장
                        tempExistingProducersRef.current = data.existingProducers || [];
                        send("get-router-rtp-capabilities", { channelPk: channelId });
                        break;

                    case "router-rtp-capabilities":
                        await loadDevice(data.rtpCapabilities);
                        break;

                    case "webrtc-transport-created":
                        // Producer용인지 Consumer용인지 구분 필요
                        // 보통 생성 요청 순서나, 응답 데이터에 type/id를 포함시켜 구분함.
                        // 하지만 이 코드 구조에서는 구분하기 까다로움.
                        // 해결책: createTransports에서 id를 미리 알고 있거나, 
                        // 서버가 transportType을 같이 보내줘야 함.
                        
                        // 임시 방편: producerTransport가 없으면 Producer용으로 간주 (순차 생성 가정)
                        // This assumes createTransports calls producer first, then consumer.
                        // And handled sequentially.
                        // 더 견고한 방법: useSfuClient 안에서 상태로 관리.
                        
                        // 여기서는 단순하게 구현:
                        // useSfuClient 내부의 handleTransportCreated를 그냥 호출하되,
                        // 내부에서 현재 생성 중인 Transport가 무엇인지 추적하는 변수가 있으면 좋음.
                        // 일단은 순차적으로 호출했으므로, 
                        // 첫 번째 'webrtc-transport-created'는 Producer, 두 번째는 Consumer라고 가정할 수 있으나 위험함.
                        
                        // 올바른 방법: createTransports 내의 Promise Resolver에서 처리하도록 소켓 메시지를 라우팅하는 것.
                        // 하지만 현재 구조상 onmessage가 여기 있으므로...
                        
                        // **중요**: 기존 useConnectSfu.ts에서는 createTransports 함수 내부에서
                        // 별도의 onMessage 리스너를 일시적으로 등록해서 이 이벤트를 낚아챘음.
                        // 따라서 여기서 전역 onmessage로 처리하면 그 로직과 충돌하거나 복잡해짐.
                        
                        // **결정**: 'webrtc-transport-created'와 'produced'는 
                        // useSfuClient.ts 내부의 createTransports / produce 함수가 
                        // 직접 리스너를 달아서 처리하도록 위임하는 것이 맞음 (기존 로직 유지).
                        // 따라서 여기 switch문에서는 처리하지 않음 (default로 빠짐).
                        handleTransportCreated(data.transportId, data.dtlsParameters);
                        break;

                    case "transport-connected":
                        console.log("SFU: Transport Connected");
                        break;

                    case "produced":
                        // 이것도 produce() 내부에서 처리하는 것이 일반적이지만,
                        // 만약 전역 처리가 필요하다면 handleProduced 호출.
                        handleProduced(data.producerId);
                        break;

                    case "new-producer":
                        console.log("SFU: New Producer", data.producerId);
                        await consumeMedia(data);
                        break;

                    case "consumed":
                        await handleConsumed(data);
                        break;

                    case "peer-left":
                        removePeer(data.userId); // userId 기반 제거
                        break;
                    
                    case "peer-disconnected": // 추가된 이벤트 예시
                        // removePeer(data.userId);
                        break;

                    case "producer-closed":
                        removePeerByProducerId(data.producerId);
                        break;

                    case "error":
                        console.error("SFU Server Error:", data.message);
                        break;
                }
            } catch (error) {
                console.error("SFU: Message parsing error", error);
            }
        };
    }, [socketRef.current, channelId, send, loadDevice, handleProduced, handleConsumed, consumeMedia, removePeer, removePeerByProducerId]);


    // 5. 초기 연결 실행
    useEffect(() => {
        if (channelId && accessToken) {
            connect();
        }
        return () => {
            disconnect();
            clientCleanup();
            clearPeers();
        };
    }, [channelId, accessToken, connect, disconnect, clientCleanup, clearPeers]);


    return {
        peers,
        connectionStatus,
        produce,
        stopProduce
    };
};
