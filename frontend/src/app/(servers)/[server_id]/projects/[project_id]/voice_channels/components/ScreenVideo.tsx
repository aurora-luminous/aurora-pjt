import { useEffect, useRef } from "react";

interface ScreenVideoProps {
  stream?: MediaStream | null;
}

export const ScreenVideo = ({ stream }: ScreenVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="
        absolute inset-0
        w-full h-full
        object-contain
        bg-black
      "
    />
  );
};
