import React from 'react';
import { getPublicFileUrl, getEmbedFileUrl, sanitizeUrl } from '../services/storageService';
import CustomVideoPlayer from './CustomVideoPlayer';

interface MediaFileViewerProps {
  path: string;
  type: 'image' | 'video' | 'unknown';
  name: string;
}

export const MediaFileViewer: React.FC<MediaFileViewerProps> = ({ path, type, name }) => {
  if (!path) return null;

  if (type === 'video') {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-black group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Cinematic blurry background */}
        <video 
          src={sanitizeUrl(getPublicFileUrl(path))} 
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-60 scale-125 pointer-events-none transition-opacity duration-700 mix-blend-screen"
          autoPlay 
          muted 
          loop 
          playsInline
        />
        <div className="absolute inset-0 bg-black/40 pointer-events-none mix-blend-overlay"></div>
        {/* Main Player */}
        <div className="relative z-10 w-full h-full outline-none" onClick={(e) => e.stopPropagation()}>
          <CustomVideoPlayer src={sanitizeUrl(getPublicFileUrl(path))} fileName={name} />
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <img
        src={sanitizeUrl(getPublicFileUrl(path))}
        alt={name}
        className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-[500px] bg-zinc-800 text-zinc-400 rounded-lg">
      <p>Visualizador não disponível para este tipo de arquivo.</p>
    </div>
  );
};
