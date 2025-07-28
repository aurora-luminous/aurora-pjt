import { Message, ChannelNameMap } from "./index";

// 채널 이름 매핑
export const channelNames: ChannelNameMap = {
  general: "일반",
  announcements: "공지사항",
};

// 채팅 메시지 목록
export const defaultMessages: Message[] = [
  {
    id: 1,
    user: "시스템",
    content: "이 채팅을 이용해주셔서 감사합니다.",
    timestamp: "오후 12:00",
    isSystem: true,
  },
  {
    id: 2,
    user: "시스템",
    content: "심근원 님이 채널을 생성하셨습니다.",
    timestamp: "오후 12:00",
    isSystem: true,
  },
  {
    id: 3,
    user: "김병년",
    content: "차렷",
    timestamp: "오후 12:02",
    isSystem: false,
  },
];
