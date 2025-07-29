"use client";

interface VoiceHeaderProps {
  channelName: string;
  onClose?: () => void;
}

export const VoiceHeader = ({ channelName, onClose }: VoiceHeaderProps) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // 기본 동작: 뒤로가기
      window.history.back();
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="flex items-center gap-2 text-white">
        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
          🔊
        </div>
        <span className="font-medium">{channelName}</span>
        <button
          onClick={handleClose}
          className="ml-2 text-gray-400 hover:text-white transition-colors"
          aria-label="채널 나가기"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414L11.414 12l3.293 3.293a1 1 0 01-1.414 1.414L10 13.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 12 5.293 8.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
