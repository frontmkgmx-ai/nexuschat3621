import React, { useState } from 'react';
import { sanitizeUrl, getEmbedFileUrl } from "../services/storageService";
import { File, Download, Play, Pause, Image as ImageIcon, Music, FileText, Film, ZoomIn } from 'lucide-react';
import MediaViewerModal from './MediaViewerModal';
import { MediaFileViewer } from './MediaFileViewer';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const CustomAudioPlayer = ({ url, name, sizeText }: { url: string, name: string, sizeText: string }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState("0:00");
  const [durationStr, setDurationStr] = React.useState("0:00");

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        document.querySelectorAll('audio').forEach(a => a !== audioRef.current && a.pause());
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
      setCurrentTime(formatTime(audioRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDurationStr(formatTime(audioRef.current.duration));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="w-[280px] sm:w-[340px] max-w-full bg-[#1a1a1c] rounded-[20px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none"></div>
      <div className="flex items-center gap-4 relative z-10">
         <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all transform active:scale-95">
           {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
         </button>
         <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-1">
               <span className="text-sm font-semibold text-white/90 truncate mr-2" title={name}>{name}</span>
               <span className="text-[10px] text-zinc-500 font-medium shrink-0">{sizeText}</span>
            </div>
            
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-2 relative cursor-pointer" onClick={(e) => {
               if(audioRef.current) {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const clickedValue = (x / rect.width) * audioRef.current.duration;
                 audioRef.current.currentTime = clickedValue;
               }
            }}>
               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
               <span className="text-[10px] text-zinc-500 font-medium">{currentTime}</span>
               <span className="text-[10px] text-zinc-500 font-medium">{durationStr}</span>
            </div>
         </div>
      </div>
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime("0:00"); }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden" 
      />
    </div>
  );
};

export default function MessageFilePreview({ message }: { message: any }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (!message?.file) return null;

  const file = message.file;
  const mimeType = file.mimeType || "";
  const isImage = mimeType.startsWith("image/");
  const isGif = mimeType === "image/gif";
  const isVideo = mimeType.startsWith("video/");
  const isAudio = mimeType.startsWith("audio/");

  const url = sanitizeUrl(file.url || file.downloadUrl);
  const embedUrl = file.path ? getEmbedFileUrl(file.path) : undefined;
  const name = file.name || "Arquivo";
  const sizeText = file.size ? formatBytes(file.size) : "";
  const ext = name.split('.').pop()?.toUpperCase() || "";

  const openViewer = () => {
    document.querySelectorAll('video').forEach((v) => v.pause());
    document.querySelectorAll('audio').forEach((a) => a.pause());
    setIsViewerOpen(true);
  };

  if (isImage) {
    if (file.path) {
      return (
        <>
        <div onClick={openViewer} className="rounded-[16px] overflow-hidden cursor-pointer max-w-full">
          <MediaFileViewer path={file.path} type="image" name={name} />
        </div>
        <MediaViewerModal 
          isOpen={isViewerOpen} 
          onClose={() => setIsViewerOpen(false)} 
          mediaUrl={sanitizeUrl(getPublicFileUrl(file.path))} 
          embedUrl={getEmbedFileUrl(file.path)}
          mimeType={mimeType} 
          fileName={name}
        />
        </>
      );
    }
    return (
      <>
        <div 
          onClick={openViewer}
          className="relative rounded-[16px] overflow-hidden cursor-pointer group bg-black/10 border border-white/5 block max-w-full leading-none"
        >
          {!imageLoaded && (
             <div className="absolute inset-0 bg-black/10 animate-pulse flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-black/20 dark:text-white/20" />
             </div>
          )}
          {url && <img
            src={url}
            alt={name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`block max-w-full h-auto max-h-[300px] object-contain transition-opacity duration-300 m-0 p-0 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />}
          {isGif && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
              GIF
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
             <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all bg-black/50 p-2 rounded-full backdrop-blur-md">
                <ZoomIn className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>
        <MediaViewerModal 
          isOpen={isViewerOpen} 
          onClose={() => setIsViewerOpen(false)} 
          mediaUrl={url} 
          embedUrl={embedUrl}
          mimeType={mimeType} 
          fileName={name}
        />
      </>
    );
  }

  if (isVideo) {
    if (file.path) {
      return (
        <div className="w-[280px] sm:w-[360px] max-w-full rounded-[16px] overflow-hidden bg-black ring-1 ring-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <MediaFileViewer path={file.path} type="video" name={name} />
          {/* CustomVideoPlayer handles its own modal internally in fullscreen mode, but just in case keeping it simple here without modal overlap */}
        </div>
      );
    }
    return (
      <>
         <div 
          onClick={openViewer}
          className="relative w-[280px] sm:w-[360px] max-w-full rounded-[16px] overflow-hidden cursor-pointer group bg-black border border-white/10 aspect-video block leading-none m-0 p-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center"
         >
           {url && <video
             src={url}
             preload="metadata"
             className="absolute inset-0 block w-full h-full object-cover blur-2xl opacity-60 scale-110 pointer-events-none mix-blend-screen"
           />}
           <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>
           {url && <video
             src={url}
             preload="metadata"
             className="relative z-10 block w-full h-full object-contain m-0 p-0"
           />}
           <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none z-20">
             <div className="bg-red-600/90 hover:bg-red-600 p-3 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.5)] transform group-hover:scale-110 transition-all">
                <Play className="w-7 h-7 text-white ml-1" />
             </div>
           </div>
           <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider flex items-center gap-1 z-10">
              <Film className="w-3 h-3" /> VIDEO
           </div>
           <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/90 z-10">
              {sizeText}
           </div>
         </div>
         <MediaViewerModal 
            isOpen={isViewerOpen} 
            onClose={() => setIsViewerOpen(false)} 
            mediaUrl={url} 
            embedUrl={embedUrl}
            mimeType={mimeType} 
            fileName={name}
          />
      </>
    );
  }

  if (isAudio) {
    return <CustomAudioPlayer url={url} name={name} sizeText={sizeText} />;
  }

  return (
    <div className="min-w-[200px] max-w-[260px] sm:max-w-[320px] bg-black/10 hover:bg-black/20 rounded-[16px] p-3.5 border border-white/5 transition-colors group flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
         {ext === 'PDF' ? <FileText className="w-5 h-5 text-red-400" /> : <File className="w-5 h-5 text-indigo-400" />}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
         <span className="text-[14px] font-medium text-white truncate block" title={name}>{name}</span>
         <span className="text-[11px] font-medium text-white/50 block mt-0.5 uppercase tracking-wider">{ext} • {sizeText}</span>
      </div>
      <a href={url} download={name} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors">
         <Download className="w-4 h-4 text-white/80" />
      </a>
    </div>
  );
}
