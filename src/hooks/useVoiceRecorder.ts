import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingStatus = "idle" | "recording" | "preview" | "uploading" | "error";

export function useVoiceRecorder(maxDurationSeconds = 300) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopMicrophoneTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const currentAudioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopMicrophoneTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDurationSeconds(0);
    setStatus("idle");
    setErrorMsg(null);
  }, [stopMicrophoneTracks]);

  useEffect(() => {
     return () => cleanup();
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      setErrorMsg(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Navegador não suporta a gravação de áudio.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });
      streamRef.current = stream;

      let mimeType = '';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        ''
      ];
      for (const t of types) {
         if (t === '' || MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
         }
      }

      const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopMicrophoneTracks();
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (chunksRef.current.length > 0) {
           const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
           const blob = new Blob(chunksRef.current, { type: actualMimeType });
           if (blob.size === 0) {
              setErrorMsg("Erro: Gravação vazia.");
              setStatus("error");
              return;
           }
           
           const url = URL.createObjectURL(blob);
           setAudioBlob(blob);
           setAudioUrl(url);
           currentAudioUrlRef.current = url;
           
           // Calculate exactly how long it was instead of relying only on intervals
           const finalDuration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
           setDurationSeconds(finalDuration);

           if (finalDuration < 1) {
              URL.revokeObjectURL(url);
              setAudioBlob(null);
              setAudioUrl(null);
              currentAudioUrlRef.current = null;
              setStatus("idle");
              // Silent rejection for < 1s
              return;
           }

           setStatus("preview");
        } else {
           setStatus("idle");
        }
      };

      mediaRecorder.start(1000); // chunk every second just in case
      startTimeRef.current = Date.now();
      setStatus("recording");

      timerRef.current = setInterval(() => {
         const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
         setDurationSeconds(elapsed);
         if (elapsed >= maxDurationSeconds) {
            stopRecording();
         }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         setErrorMsg("Permissão de microfone negada. Autorize no navegador para gravar.");
      } else {
         setErrorMsg(err.message || "Erro ao iniciar microfone.");
      }
      setStatus("error");
      stopMicrophoneTracks();
    }
  }, [cleanup, maxDurationSeconds, stopMicrophoneTracks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const resetRecording = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    status,
    setStatus,
    audioBlob,
    audioUrl,
    durationSeconds,
    errorMsg,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
    cleanup
  };
}

export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
