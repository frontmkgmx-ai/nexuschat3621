import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatDuration } from '../hooks/useVoiceRecorder';

interface VoiceMessageBubbleProps {
    mediaUrl: string;
    durationSeconds: number;
    isMine: boolean;
}

export default function VoiceMessageBubble({ mediaUrl, durationSeconds, isMine }: VoiceMessageBubbleProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [hasLoaded, setHasLoaded] = useState(false);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                // Pause all other audios before playing
                document.querySelectorAll('audio').forEach((a) => {
                    if (a !== audioRef.current) a.pause();
                });
                audioRef.current.play().catch(e => console.error("Error playing audio", e));
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(isNaN(p) ? 0 : p);
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    useEffect(() => {
        const handlePauseOther = () => {
            if (audioRef.current && !audioRef.current.paused) {
                setIsPlaying(false);
            }
        };
        const audioEl = audioRef.current;
        if (audioEl) {
            audioEl.addEventListener('pause', () => setIsPlaying(false));
            audioEl.addEventListener('play', () => setIsPlaying(true));
        }
        return () => {
            if (audioEl) {
                audioEl.removeEventListener('pause', () => setIsPlaying(false));
                audioEl.removeEventListener('play', () => setIsPlaying(true));
            }
        };
    }, []);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickedValue = (x / rect.width) * (audioRef.current.duration || durationSeconds);
            audioRef.current.currentTime = clickedValue;
            setCurrentTime(clickedValue);
        }
    };

    return (
        <div className={`flex items-center gap-3 w-[220px] sm:w-[260px] pb-1`}>
            <button 
                onClick={togglePlay} 
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transform transition-all active:scale-95 ${
                    isMine ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-white/10 hover:bg-white/20'
                }`}
            >
                {isPlaying ? (
                    <Pause className={`w-5 h-5 ${isMine ? 'text-white' : 'text-zinc-200'}`} />
                ) : (
                    <Play className={`w-5 h-5 ml-1 ${isMine ? 'text-white' : 'text-zinc-200'}`} />
                )}
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1.5 h-11">
                <div 
                    className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden relative cursor-pointer"
                    onClick={handleSeek}
                >
                    <div 
                        className={`h-full rounded-full transition-all duration-100 ease-linear ${isMine ? 'bg-white' : 'bg-indigo-400'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[11px] font-medium opacity-80">
                    <span className="font-mono">{formatDuration(isPlaying ? currentTime : durationSeconds)}</span>
                </div>
            </div>
            
            <audio 
                ref={audioRef} 
                src={mediaUrl} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedData={() => setHasLoaded(true)}
                className="hidden" 
                preload="metadata"
            />
        </div>
    );
}
