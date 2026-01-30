import { useState } from "react";

export const useAudio = () => {
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);

    const startAudio = async () => 
    {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true})
            setAudioStream(stream)
            setIsAudioEnabled(true) // Set enabled
            setAudioError(null)
        }catch (error) {
            setAudioError(error instanceof Error ? error.message: "Unknown error")
            setAudioStream(null)
            setIsAudioEnabled(false)
        }
    }

    const muteAudio = () => {
        if (audioStream) {
            audioStream.getAudioTracks()[0].enabled = false
            setIsAudioEnabled(false) // Set disabled
            setAudioError(null)
        }
    }

    const toggleAudio = () => {
        if (audioStream && isAudioEnabled) { // Check enabled state
            muteAudio()
        }else {
            if (audioStream) {
                 // If stream exists but disabled, enable it (unmute)
                 audioStream.getAudioTracks()[0].enabled = true;
                 setIsAudioEnabled(true);
            } else {
                 startAudio()
            }
        }
    }
    return {
        audioStream,
        setAudioStream,
        audioError,
        setAudioError,
        startAudio,
        muteAudio,
        toggleAudio,
        isAudioEnabled,
    }
}