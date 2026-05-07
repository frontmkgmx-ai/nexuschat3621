import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize, Settings, Download, MoreVertical, Check, PictureInPicture } from 'lucide-react';
import { sanitizeUrl } from '../services/fileApi';

export default function CustomVideoPlayer({
    src,
    fileName,
    autoPlay = false,
}: {
    src: string;
    fileName?: string;
    autoPlay?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100 || 0);
        };
        const handleLoadedMetadata = () => {
             setDuration(video.duration);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Play prevented:', error);
                        setIsPlaying(false);
                    });
                }
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            if (val === 0) {
                 videoRef.current.muted = true;
                 setIsMuted(true);
            } else {
                 videoRef.current.muted = false;
                 setIsMuted(false);
            }
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error("Error attempting to enable fullscreen:", err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const togglePiP = async () => {
        if (videoRef.current && document.pictureInPictureEnabled) {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        }
    };

    const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        videoRef.current.currentTime = (percentage / 100) * videoRef.current.duration;
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleMouseLeave = () => {
        if (isPlaying) setShowControls(false);
    };

    const changePlaybackRate = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setShowSettings(false);
        }
    };

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-full max-h-[100vh] bg-black group overflow-hidden flex items-center justify-center font-sans select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
               if((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                   setShowSettings(false);
               }
            }}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                playsInline
                autoPlay={autoPlay}
            />

            {/* Controls Overlay */}
            <div 
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12 pb-4 px-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
            >
                {/* Progress Bar */}
                <div 
                    className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative group/progress"
                    onClick={handleProgressChange}
                >
                    <div 
                        className="h-full bg-red-500 rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-500 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors focus:outline-none">
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>
                        
                        <div className="flex items-center gap-2 group/volume relative">
                            <button onClick={toggleMute} className="text-white hover:text-red-400 transition-colors focus:outline-none peer">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-20 peer-focus:w-20 peer-hover:w-20 transition-all duration-300 flex items-center">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={isMuted ? 0 : volume} 
                                    onChange={handleVolumeChange}
                                    className="w-full h-1.5 accent-white rounded-full bg-white/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>

                        <div className="text-white/90 text-sm font-medium tracking-wide">
                            {formatTime(currentTime)} <span className="text-white/50 mx-1">/</span> {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {document.pictureInPictureEnabled && (
                            <button onClick={togglePiP} className="text-white hover:text-red-400 transition-colors focus:outline-none" title="Picture in Picture">
                                <PictureInPicture className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSettings(!showSettings);
                            }} 
                            className={`text-white hover:text-red-400 transition-colors focus:outline-none ${showSettings ? 'rotate-90 text-red-400' : ''}`}
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        <button onClick={toggleFullscreen} className="text-white hover:text-red-400 transition-colors focus:outline-none">
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>

                        {/* Settings Popup */}
                        {showSettings && (
                            <div 
                                className="absolute bottom-12 right-12 bg-zinc-900/95 backdrop-blur-md rounded-xl p-2 w-56 text-white border border-white/10 shadow-2xl z-50 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                    Velocidade
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                                        <button 
                                            key={rate} 
                                            onClick={() => changePlaybackRate(rate)}
                                            className="px-3 py-2 hover:bg-white/10 rounded-lg flex items-center justify-between transition-colors w-full text-left"
                                        >
                                            <span>{rate === 1 ? 'Normal' : rate + 'x'}</span>
                                            {playbackRate === rate && <Check className="w-4 h-4 text-red-500" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="h-px bg-white/10 my-1.5" />
                                <a 
                                    href={src} 
                                    download={fileName || "video.mp4"} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-2 hover:bg-white/10 rounded-lg flex items-center justify-between transition-colors w-full text-left text-zinc-100"
                                >
                                    <span>Download do Vídeo</span>
                                    <Download className="w-4 h-4 text-zinc-400" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Play/pause pulse overlay for centered click feedback */}
            {!isPlaying && !showSettings && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
                         <Play className="w-8 h-8 fill-white text-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
}
