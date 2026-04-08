import { useState } from "react";

export const useCamera = () => {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setCameraStream(stream);
      setCameraError(null);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Unknown error");
      setCameraStream(null);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const toggleCamera = () => {
    if (cameraStream) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return {
    cameraStream,
    setCameraStream,
    cameraError,
    setCameraError,
    startCamera,
    stopCamera,
    toggleCamera,
  };
};
