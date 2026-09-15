import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import { getPublicFileUrl, sanitizeUrl } from '../services/storageService';

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

interface VoiceMessageBubbleProps {
  mediaUrl: string;
  durationSeconds: number;
  mimeType?: string;
  isMine: boolean;
}

export default function VoiceMessageBubble({ mediaUrl, durationSeconds, mimeType, isMine }: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [realDuration, setRealDuration] = useState<number>(durationSeconds || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rawUrl = sanitizeUrl(getPublicFileUrl(mediaUrl));

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      setErrorMessage(null);

      // Regra do produto: Pausar todas as outras reproduções antes de tocar
      document.querySelectorAll('audio').forEach((a) => {
        if (a !== audioRef.current && !a.paused) {
          a.pause();
        }
      });

      setIsLoading(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading(false);
            setIsPlaying(true);
          })
          .catch((e) => {
            setIsLoading(false);
            setIsPlaying(false);
            if (e?.name === 'AbortError') {
              // Interrupção esperada por pausa subsequente ou navegação
              return;
            }
            console.warn('Voice message playback prevented:', e?.message || e?.name);
            setHasError(true);
            setErrorMessage('Toque para tentar novamente');
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || realDuration;
      const p = dur > 0 ? (cur / dur) * 100 : 0;
      setProgress(isNaN(p) ? 0 : Math.min(100, p));
      setCurrentTime(cur);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setRealDuration(dur);
      }
    }
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    setHasError(true);
    const mediaErr = audioRef.current?.error;
    if (mediaErr?.code === 4) {
      setErrorMessage('Formato não suportado');
    } else {
      setErrorMessage('Erro ao reproduzir');
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audioEl.addEventListener('play', onPlay);
    audioEl.addEventListener('pause', onPause);
    audioEl.addEventListener('waiting', onWaiting);
    audioEl.addEventListener('canplay', onCanPlay);

    return () => {
      audioEl.removeEventListener('play', onPlay);
      audioEl.removeEventListener('pause', onPause);
      audioEl.removeEventListener('waiting', onWaiting);
      audioEl.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && !hasError) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const targetDur = audioRef.current.duration || realDuration;
      if (targetDur > 0) {
        const clickedValue = Math.max(0, Math.min(targetDur, (x / rect.width) * targetDur));
        audioRef.current.currentTime = clickedValue;
        setCurrentTime(clickedValue);
        setProgress((clickedValue / targetDur) * 100);
      }
    }
  };

  const displayedDuration = isPlaying ? currentTime : (realDuration || durationSeconds || 0);

  return (
    <div className="flex items-center gap-3 w-[220px] sm:w-[260px] pb-1">
      <button
        onClick={togglePlay}
        disabled={isLoading && !hasError}
        aria-label={isPlaying ? 'Pausar mensagem de voz' : 'Reproduzir mensagem de voz'}
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transform transition-all active:scale-95 ${
          hasError
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : isMine
            ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
            : 'bg-white/10 hover:bg-white/20 text-zinc-200'
        }`}
      >
        {hasError ? (
          <RefreshCw className="w-5 h-5 text-red-400 animate-pulse" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-1" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 h-11">
        <div
          className={`h-1.5 w-full bg-black/20 rounded-full overflow-hidden relative ${hasError ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          onClick={handleSeek}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${
              hasError ? 'bg-red-400' : isMine ? 'bg-white' : 'bg-indigo-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-medium opacity-80">
          <span className="font-mono">
            {hasError ? (
              <span className="text-red-400 font-sans text-[10px]">{errorMessage || 'Erro'}</span>
            ) : (
              formatDuration(displayedDuration)
            )}
          </span>
          {mimeType && !hasError && (
            <span className="text-[9px] uppercase tracking-wider text-zinc-400/80">
              {mimeType.includes('opus') ? 'Opus' : mimeType.includes('mp4') || mimeType.includes('aac') ? 'AAC' : ''}
            </span>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        className="hidden"
      >
        {mimeType ? <source src={rawUrl} type={mimeType} /> : null}
        <source src={rawUrl} />
      </audio>
    </div>
  );
}
