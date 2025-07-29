import { useFullscreen } from "../../../../../hooks/useFullscreen";

interface FullscreenButtonProps {
  onToggleFullscreen: () => void;
  isFullScreen: boolean;
}

export const FullscreenButton = ({
  onToggleFullscreen,
  isFullScreen,
}: FullscreenButtonProps) => {
  // useFullscreen hook 사용
  const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen();

  // 맥북 크롬 감지
  const isMacChrome = () => {
    return (
      navigator.platform.includes("Mac") &&
      navigator.userAgent.includes("Chrome")
    );
  };

  // 전체화면 토글 핸들러
  const handleClick = async () => {
    try {
      if (isSupported) {
        // hook의 toggleFullscreen 사용
        await toggleFullscreen();
      }

      // Redux 상태도 동기화
      onToggleFullscreen();
    } catch (error) {
      // 맥북 크롬에서 차단되는 경우 안내 메시지
      if (isMacChrome()) {
        alert(
          '🔒 크롬에서 전체화면이 차단되었습니다.\n\n해결 방법:\n1. 주소창 좌측 🔒 아이콘 클릭\n2. "팝업 및 리디렉션" → 허용\n3. 페이지 새로고침\n\n또는 Safari 브라우저를 사용해보세요!'
        );
      }

      // 실패해도 Redux 상태는 토글 (UI 피드백용)
      onToggleFullscreen();
    }
  };

  // 실제 브라우저 fullscreen 상태 우선, 없으면 Redux 상태 사용
  const displayState = isSupported ? isFullscreen : isFullScreen;

  // 맥북 크롬 사용자를 위한 툴팁 메시지
  const getTooltip = () => {
    if (isMacChrome() && !isSupported) {
      return displayState
        ? "전체화면 나가기 (ESC)"
        : "전체화면 진입 (크롬에서 차단될 수 있음 - Safari 권장)";
    }
    return displayState ? "전체화면 나가기 (ESC)" : "전체화면 진입";
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
        displayState
          ? "bg-blue-600 hover:bg-blue-700 scale-110"
          : "bg-gray-800 hover:bg-gray-700"
      } ${isMacChrome() && !isSupported ? "ring-1 ring-yellow-400" : ""}`}
      aria-label={getTooltip()}
      title={getTooltip()}
    >
      {displayState ? (
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8 4a1 1 0 011-1h2a1 1 0 110 2H9.414l2.293 2.293a1 1 0 11-1.414 1.414L8 6.414V8a1 1 0 11-2 0V4a1 1 0 011-1zm4 12a1 1 0 01-1 1H9a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L12 13.586V12a1 1 0 112 0v4a1 1 0 01-1 1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};
