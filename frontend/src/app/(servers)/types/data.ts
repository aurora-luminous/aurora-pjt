import {
  Project,
  User,
  DirectMessage,
  Channel,
  ServerNameMap,
  ProjectNameMap,
  ChannelNameMap,
} from "./index";

// 서버의 프로젝트 목록 (동적으로 변경 가능)
export const projects: Project[] = [
  {
    id: "general",
    name: "일반",
    description: "일반적인 대화",
    members: 5,
    color: "bg-indigo-500",
  },
  {
    id: "main-schedule",
    name: "주요 일정",
    description: "중요한 일정 관리",
    members: 8,
    color: "bg-gray-500",
  },
];

// 채널 목록 (프로젝트 내에서 일관되게 표시)
export const channels: Channel[] = [
  { id: "general", name: "일반", type: "text" },
  { id: "announcements", name: "공지사항", type: "notice" },
  { id: "dev-talk", name: "개발 이야기", type: "text" },
  { id: "voice-general", name: "일반", type: "voice" },
  { id: "voice-meeting", name: "회의실", type: "voice" },
];

// 기본 사용자 목록 데이터
export const defaultUsers: User[] = [
  { id: "1", name: "김병년", status: "online", role: "SIDABARY" },
  { id: "2", name: "김세현", status: "away", role: "Backend Developer" },
  { id: "3", name: "이용재", status: "busy", role: "Backend Developer" },
  { id: "4", name: "심근원", status: "online", role: "Infra Engineer" },
  { id: "5", name: "손짐니", status: "online", role: "CEO" },
];

// 기본 다이렉트 메시지 목록
export const defaultDirectMessages: DirectMessage[] = [
  {
    id: "1",
    name: "김병년",
    status: "online",
    lastMessage: "오늘 회의 어떻게 진행되나요?",
    timestamp: "10분 전",
  },
  {
    id: "2",
    name: "김세현",
    status: "away",
    lastMessage: "API 문서 업데이트 완료했습니다",
    timestamp: "30분 전",
  },
  {
    id: "3",
    name: "이용재",
    status: "busy",
    lastMessage: "내일 발표 준비 같이 해요",
    timestamp: "1시간 전",
  },
  {
    id: "4",
    name: "심근원",
    status: "online",
    lastMessage: "오늘 회의 어떻게 진행되나요?",
    timestamp: "10분 전",
  },
  {
    id: "5",
    name: "손짐니",
    status: "online",
    lastMessage: "프로젝트 진행 상황 공유드려요",
    timestamp: "2시간 전",
  },
];

// 이름 매핑 객체들
export const serverNames: ServerNameMap = {
  "ssafy-research": "Meeting ssafy",
  "test-server": "테스트 서버",
  "dev-server": "개발 서버",
};

export const projectNames: ProjectNameMap = {
  general: "일반",
  "main-schedule": "주요 일정",
};

export const channelNames: ChannelNameMap = {
  general: "일반",
  announcements: "공지사항",
  "dev-talk": "개발 이야기",
  "voice-general": "일반",
  "voice-meeting": "회의실",
};
