export enum SfuEvent {
    JOIN_ROOM = "join-room",
    JOIN_ROOM_SUCCESS = "joinRoomSuccess",

    GET_ROUTER_RTP_CAPS = "get-router-rtp-capabilities",
    ROTUER_RTP_CAPS = "router-rtp-capabilities",

    CREATE_TRANSPORT = "create-webrtc-transport",
    TRANSPORT_CREATED = "webrtc-transport-created",
    CONNECT_TRANSPORT = "connect-tranpsport",
    TRANSPORT_CONNECTED = "transport-connected",

    PRODUCE = "produce",
    PRODUCED = "produced",

    NEW_PRODUCER = "new-producer",
    CONSUME = "consume",
    CONSUMED = "consumed",

    RESUME_CONSUMER = "resume-consumer",
    RESUMED_CONSUMER = "consumer-resumed",

    CLOSE_PRODUCER = "close-producer",
    PRODUCER_CLOSED = "producer-closed",

    PEER_LEFT = "peer-left",
    PEER_DISCONNECTED = "peer-disconnected",

    GET_PRODUCERS = "get-producers",
    GET_PRODUCERS_RESPONSE = "producers-list",

    ERROR="error"
}