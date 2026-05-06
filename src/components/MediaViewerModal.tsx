import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, ZoomIn } from 'lucide-react';
import { sanitizeUrl } from '../services/fileApi';

export default function MediaViewerModal({
  isOpen,
  onClose,
  mediaUrl,
  embedUrl,
  mimeType,
  fileName,
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  embedUrl?: string;
  mimeType: string;
  fileName: string;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col"
        onClick={onClose}
      >
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm truncate max-w-xs sm:max-w-md">{fileName}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={sanitizeUrl(mediaUrl)} download={fileName} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
              <Download className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-0 sm:p-4 min-h-0 relative">
          {mimeType?.startsWith('image/') && mediaUrl ? (
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={sanitizeUrl(mediaUrl)}
              alt={fileName}
              className="w-full h-full object-contain pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />
          ) : mimeType?.startsWith('video/') && (embedUrl || mediaUrl) ? (
            embedUrl ? (
               <motion.iframe
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  src={sanitizeUrl(embedUrl)}
                  className="w-full h-full max-w-[100vw] max-h-[100vh] border-0 pointer-events-auto"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  onClick={(e) => e.stopPropagation()}
               />
            ) : (
              <motion.video
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={sanitizeUrl(mediaUrl)}
                controls
                autoPlay
                className="w-full h-full max-w-[100vw] max-h-[100vh] object-contain pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              />
            )
          ) : <div className="text-white">Media unavailable</div>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
