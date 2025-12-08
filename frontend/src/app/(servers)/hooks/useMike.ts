import { useState } from "react";

export const useMike = () => {
  const [mikeStream, setMikeStream] = useState<MediaStream | null>(null);
  const [mikeError, setMikeError] = useState<string | null>(null);

  const startMike = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMikeStream(stream);
      setMikeError(null);
    } catch (error) {
      setMikeError(error instanceof Error ? error.message : "Unknown error");
      setMikeStream(null);
    }
  };

  const stopMike = () => {
    if (mikeStream) {
      mikeStream.getAudioTracks().forEach((track) => track.stop());
      setMikeStream(null);
    }
  };

  const toggleMike = () => {
    if (mikeStream) {
      stopMike();
    } else {
      startMike();
    }
  };

  return {
    mikeStream,
    setMikeStream,
    mikeError,
    setMikeError,
    startMike,
    stopMike,
    toggleMike,
  };
};
