import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize, 
  Play, 
  Pause, 
  RotateCcw as SkipBack5, 
  RotateCw as SkipForward5, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Check, 
  Music, 
  HardDrive,
  Sparkles
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { sanitizeUrl } from '../services/storageService';
import { useCachedMedia } from '../services/mediaCacheService';
import CustomVideoPlayer from './CustomVideoPlayer';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  embedUrl?: string;
  mimeType: string;
  fileName: string;
}

export default function MediaViewerModal({
  isOpen,
  onClose,
  mediaUrl,
  embedUrl,
  mimeType,
  fileName,
}: MediaViewerModalProps) {
  const { cachedUrl, isCached } = useCachedMedia(mediaUrl);
  const activeUrl = sanitizeUrl(cachedUrl || mediaUrl);

  const [rotation, setRotation] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioVolume, setAudioVolume] = useState<number>(1);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const isImage = mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName || '');
  const isVideo = mimeType?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(fileName || '');
  const isAudio = mimeType?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|opus|flac)$/i.test(fileName || '');

  // Reset states on open/change
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setIsAudioPlaying(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
      setPlaybackSpeed(1);
    }
  }, [isOpen, mediaUrl]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'r' || e.key === 'R') {
        if (isImage) {
          setRotation((prev) => (prev + 90) % 360);
        }
      } else if (e.key === ' ' && isAudio && audioRef.current) {
        e.preventDefault();
        toggleAudioPlay();
      } else if (e.key === 'ArrowLeft' && isAudio && audioRef.current) {
        e.preventDefault();
        skipAudio(-5);
      } else if (e.key === 'ArrowRight' && isAudio && audioRef.current) {
        e.preventDefault();
        skipAudio(5);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isImage, isAudio, isAudioPlaying]);

  // Audio playback controls
  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    }
  };

  const skipAudio = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(audioDuration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setAudioCurrentTime(target);
    if (audioDuration > 0) {
      setAudioProgress((target / audioDuration) * 100);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const targetTime = (percentage / 100) * audioDuration;
    audioRef.current.currentTime = targetTime;
    setAudioCurrentTime(targetTime);
    setAudioProgress(percentage);
  };

  const toggleAudioMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isAudioMuted;
    setIsAudioMuted(!isAudioMuted);
  };

  const handleCopyLink = () => {
    if (activeUrl) {
      navigator.clipboard.writeText(activeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatAudioTime = (time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col select-none"
        onClick={onClose}
      >
        {/* Top Bar */}
        <div 
          className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              {isImage ? <ZoomIn className="w-5 h-5 text-indigo-400" /> : isVideo ? <Play className="w-5 h-5 text-emerald-400" /> : <Music className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-white font-medium text-sm truncate max-w-xs sm:max-w-md" title={fileName}>
                {fileName || 'Arquivo Multimídia'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">
                  {mimeType?.split('/')[1]?.toUpperCase() || (isImage ? 'IMG' : isVideo ? 'VID' : 'AUDIO')}
                </span>
                {isCached && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    <HardDrive className="w-3 h-3" /> Em cache
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Rotate control for images */}
            {isImage && (
              <button 
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                title="Girar 90° (R)" 
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Share / Copy link */}
            <button 
              onClick={handleCopyLink}
              title="Copiar Link" 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Download */}
            <a 
              href={activeUrl} 
              download={fileName || 'download'} 
              target="_blank" 
              rel="noreferrer" 
              title="Baixar Arquivo" 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Close */}
            <button 
              onClick={onClose} 
              title="Fechar (Esc)" 
              className="p-2.5 bg-white/10 hover:bg-red-500/40 rounded-full transition-colors text-white ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center p-0 sm:p-4 min-h-0 relative">
          {/* IMAGE VIEWER WITH ZOOM & PAN */}
          {isImage && activeUrl ? (
            <div 
              className="w-full h-full flex flex-col items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <TransformWrapper 
                initialScale={1}
                minScale={0.8}
                maxScale={6}
                centerOnInit
                wheel={{ step: 0.15 }}
                doubleClick={{ step: 0.7 }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TransformComponent 
                      wrapperClass="w-full h-full" 
                      contentClass="w-full h-full flex items-center justify-center"
                    >
                      <motion.img
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        src={activeUrl}
                        alt={fileName}
                        style={{ transform: `rotate(${rotation}deg)` }}
                        className="w-full h-full object-contain pointer-events-auto transition-transform duration-200"
                      />
                    </TransformComponent>

                    {/* Floating Zoom & Control Bar */}
                    <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-30">
                      <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl pointer-events-auto">
                        <button
                          onClick={() => zoomIn()}
                          title="Zoom +"
                          className="p-2 hover:bg-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => zoomOut()}
                          title="Zoom -"
                          className="p-2 hover:bg-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => resetTransform()}
                          title="Tamanho Original (1:1)"
                          className="px-2.5 py-1 text-xs font-semibold hover:bg-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
                        >
                          1:1
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button
                          onClick={() => setRotation((prev) => (prev + 90) % 360)}
                          title="Girar 90°"
                          className="p-2 hover:bg-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </TransformWrapper>
            </div>
          ) : isVideo && (embedUrl || activeUrl) ? (
            /* VIDEO VIEWER */
            <div className="w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
              {embedUrl ? (
                <motion.iframe
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  src={sanitizeUrl(embedUrl)}
                  className="w-full h-full max-w-[100vw] max-h-[90vh] rounded-2xl border-0 shadow-2xl"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <CustomVideoPlayer src={activeUrl} fileName={fileName} autoPlay={true} />
              )}
            </div>
          ) : isAudio && activeUrl ? (
            /* AUDIO MODAL PLAYER */
            <div 
              className="w-full max-w-xl mx-auto p-6 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center relative overflow-hidden"
              >
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />

                {/* Animated Equalizer Visualizer */}
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-inner relative group">
                  <Music className={`w-10 h-10 text-indigo-400 ${isAudioPlaying ? 'animate-bounce' : ''}`} />
                  {isAudioPlaying && (
                    <div className="absolute -bottom-1 inset-x-4 flex items-end justify-between h-4 pointer-events-none">
                      <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                      <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-4" />
                      <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2" />
                      <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
                      <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-3" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white text-center truncate max-w-sm mb-1">
                  {fileName || 'Mensagem de Áudio'}
                </h3>
                <p className="text-xs text-zinc-400 mb-6 font-mono">
                  {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                </p>

                {/* Seek Bar */}
                <div 
                  onClick={handleAudioSeek}
                  className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative mb-6 group/seek"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative"
                    style={{ width: `${audioProgress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover/seek:scale-100 transition-transform" />
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between w-full">
                  {/* Speed Button */}
                  <button
                    onClick={cycleSpeed}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Play / Skip Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => skipAudio(-5)}
                      title="Voltar 5s"
                      className="p-3 text-zinc-400 hover:text-white transition-colors"
                    >
                      <SkipBack5 className="w-6 h-6" />
                    </button>

                    <button
                      onClick={toggleAudioPlay}
                      className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.5)] transform active:scale-95 transition-all"
                    >
                      {isAudioPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </button>

                    <button
                      onClick={() => skipAudio(5)}
                      title="Avançar 5s"
                      className="p-3 text-zinc-400 hover:text-white transition-colors"
                    >
                      <SkipForward5 className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Mute Button */}
                  <button
                    onClick={toggleAudioMute}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  >
                    {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Hidden Native Audio Element */}
                <audio
                  ref={audioRef}
                  src={activeUrl}
                  preload="metadata"
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      const cur = audioRef.current.currentTime;
                      const dur = audioRef.current.duration || 0;
                      setAudioCurrentTime(cur);
                      if (dur > 0) {
                        setAudioDuration(dur);
                        setAudioProgress((cur / dur) * 100);
                      }
                    }
                  }}
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    if (dur && !isNaN(dur)) setAudioDuration(dur);
                  }}
                  onEnded={() => {
                    setIsAudioPlaying(false);
                    setAudioProgress(0);
                    setAudioCurrentTime(0);
                  }}
                  className="hidden"
                />
              </motion.div>
            </div>
          ) : (
            <div className="text-zinc-400 font-medium text-sm flex flex-col items-center gap-2">
              <span>Mídia indisponível para pré-visualização.</span>
              <a
                href={activeUrl}
                download={fileName}
                className="text-indigo-400 hover:underline text-xs"
              >
                Clique para baixar o arquivo
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
