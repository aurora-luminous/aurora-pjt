import { useRef, useState } from "react";

export const useMike = (onVolumeChange?: (isSpeaking: boolean) => void) => {
  const [mikeStream, setMikeStream] = useState<MediaStream | null>(null);
  const [mikeError, setMikeError] = useState<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const startMike = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMikeStream(stream);
      setMikeError(null);

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;

      dataArrayRef.current = new Uint8Array(bufferLength);

      noticeSpeech();

      source.connect(analyserRef.current);
    } catch (error) {
      setMikeError(error instanceof Error ? error.message : "Unknown error");
      setMikeStream(null);
    }
  };

  const noticeSpeech = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return;

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray as any);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;

      const isSpeaking = avg > 20;

      onVolumeChange?.(isSpeaking);

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
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
