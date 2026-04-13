import type { PrivateMessage, ChatUser } from "../types";

export const chatUsers: ChatUser[] = [
  { id: 1, name: "김병년", status: "online" },
  { id: 2, name: "김세현", status: "away" },
  { id: 3, name: "이용재", status: "busy" },
  { id: 4, name: "심근원", status: "online" },
  { id: 5, name: "손짐니", status: "online" },
];

export const getDefaultPrivateMessages = (userId: string): PrivateMessage[] => {
  const userSpecificMessages: { [key: string]: PrivateMessage[] } = {
    "1": [
      {
        id: 1,
        sender: "김병년",
        content: "안녕하세요! 프로젝트 진행 어떻게 되고 있나요?",
        timestamp: "오전 10:30",
        isOwn: false,
      },
      {
        id: 2,
        sender: "심근원",
        content: "잘 진행되고 있습니다. 오늘 회의 시간 조율해주세요!",
        timestamp: "오전 10:32",
        isOwn: true,
      },
      {
        id: 3,
        sender: "김병년",
        content: "오후 2시는 어떠세요?",
        timestamp: "오전 10:33",
        isOwn: false,
      },
      {
        id: 4,
        sender: "심근원",
        content: "좋습니다! 그때 뵙겠습니다.",
        timestamp: "오전 10:35",
        isOwn: true,
      },
    ],
    "2": [
      {
        id: 1,
        sender: "김세현",
        content: "API 문서 리뷰 부탁드립니다.",
        timestamp: "오후 1:15",
        isOwn: false,
      },
      {
        id: 2,
        sender: "심근원",
        content: "네, 확인해보겠습니다!",
        timestamp: "오후 1:20",
        isOwn: true,
      },
    ],
    "3": [
      {
        id: 1,
        sender: "이용재",
        content: "백엔드 설계 관련해서 논의할 것이 있습니다.",
        timestamp: "오후 3:00",
        isOwn: false,
      },
      {
        id: 2,
        sender: "심근원",
        content: "어떤 부분인가요?",
        timestamp: "오후 3:05",
        isOwn: true,
      },
      {
        id: 3,
        sender: "이용재",
        content: "데이터베이스 스키마 구조입니다.",
        timestamp: "오후 3:07",
        isOwn: false,
      },
    ],
    "5": [
      {
        id: 1,
        sender: "손짐니",
        content: "프로젝트 진행 어떻게 되고 있나요?",
        timestamp: "오전 10:30",
        isOwn: false,
      },
    ],
  };

  return userSpecificMessages[userId] || [];
};
