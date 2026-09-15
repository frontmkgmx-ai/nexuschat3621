import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  Copy, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  Play, 
  Pause,
  SmilePlus,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sanitizeUrl, getPublicFileUrl } from '../services/storageService';
import { useCachedMedia } from '../services/mediaCacheService';

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: any;
  currentUserId: string;
  onReact?: (emoji: string) => void;
  onOpenMedia?: (file: any) => void;
}

export default function MessageDetailsModal({
  isOpen,
  onClose,
  message,
  currentUserId,
  onReact,
  onOpenMedia,
}: MessageDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const fileUrl = message?.file?.downloadUrl || message?.file?.url || (message?.file?.path ? getPublicFileUrl(message.file.path) : null);
  const { cachedUrl } = useCachedMedia(fileUrl);

  if (!isOpen || !message) return null;

  const isOwn = message.senderId === currentUserId;
  const createdAtDate = message.createdAt ? new Date(message.createdAt) : new Date();
  
  const formattedDate = !isNaN(createdAtDate.getTime()) 
    ? format(createdAtDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Data desconhecida';
  
  const formattedTime = !isNaN(createdAtDate.getTime())
    ? format(createdAtDate, "HH:mm:ss", { locale: ptBR })
    : '--:--:--';

  const isDelivered = message.status === 'delivered' || message.status === 'read' || message.read;
  const isRead = message.status === 'read' || message.read;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = message.file?.type?.startsWith('image/') || message.type === 'image';
  const isVideo = message.file?.type?.startsWith('video/') || message.type === 'video';
  const isAudio = message.file?.type?.startsWith('audio/') || message.type === 'audio' || message.type === 'voice';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                {isOwn ? 'Eu' : (message.senderName?.[0]?.toUpperCase() || 'U')}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-base leading-tight">
                  {isOwn ? 'Você' : (message.senderName || 'Remetente')}
                </h3>
                <p className="text-xs text-zinc-400 capitalize">{formattedDate}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-sm">
            {/* Status & Delivery Card */}
            <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isRead 
                    ? 'bg-blue-500/10 text-blue-400' 
                    : isDelivered 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isRead ? (
                    <CheckCheck className="w-4 h-4" />
                  ) : isDelivered ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-zinc-200">
                    {isRead ? 'Mensagem Lida' : isDelivered ? 'Mensagem Entregue' : 'Enviando / Pendente'}
                  </p>
                  <p className="text-xs text-zinc-500">Horário exato: {formattedTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>E2EE</span>
              </div>
            </div>

            {/* Message Text Content */}
            {message.text && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium uppercase tracking-wider">Conteúdo</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar texto
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 text-zinc-200 leading-relaxed break-words whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                  {message.text}
                </div>
              </div>
            )}

            {/* Media Attachment View */}
            {message.file && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium uppercase tracking-wider">Anexo Multimídia</span>
                  {fileUrl && (
                    <a
                      href={sanitizeUrl(fileUrl)}
                      download={message.file.name || 'arquivo'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar
                    </a>
                  )}
                </div>

                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      {isImage ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : isVideo ? (
                        <VideoIcon className="w-5 h-5" />
                      ) : isAudio ? (
                        <Music className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{message.file.name || 'Arquivo anexado'}</p>
                      <p className="text-xs text-zinc-500">
                        {message.file.type || 'Desconhecido'} {message.file.size ? `• ${formatFileSize(message.file.size)}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Thumbnail / Direct player for Image, Video, Audio */}
                  {isImage && fileUrl && (
                    <div 
                      onClick={() => onOpenMedia?.(message.file)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-zinc-800 max-h-48 flex items-center justify-center bg-black/40 group relative"
                    >
                      <img 
                        src={cachedUrl || fileUrl} 
                        alt="Preview" 
                        className="max-h-48 object-contain transition-transform group-hover:scale-105 duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          Clique para expandir
                        </span>
                      </div>
                    </div>
                  )}

                  {isVideo && fileUrl && (
                    <div 
                      onClick={() => onOpenMedia?.(message.file)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-zinc-800 aspect-video flex items-center justify-center bg-black group relative"
                    >
                      <video src={cachedUrl || fileUrl} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 ml-0.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  )}

                  {isAudio && fileUrl && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                      <button
                        onClick={handleToggleAudio}
                        className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 hover:bg-indigo-500 transition-colors"
                      >
                        {isAudioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-zinc-300 font-medium block truncate">Áudio da mensagem</span>
                        <span className="text-[10px] text-zinc-500">Toque para ouvir na íntegra</span>
                      </div>
                      <audio 
                        ref={audioRef} 
                        src={cachedUrl || fileUrl} 
                        onEnded={() => setIsAudioPlaying(false)} 
                        className="hidden" 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reactions List */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Reações</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(message.reactions).map(([emoji, users]: [string, any]) => {
                    const count = Array.isArray(users) ? users.length : 1;
                    return (
                      <div 
                        key={emoji}
                        className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700/60 px-3 py-1.5 rounded-full text-xs"
                      >
                        <span className="text-base">{emoji}</span>
                        <span className="font-semibold text-zinc-300">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[200px]">
              ID: {message.id || message._id || 'msg_0'}
            </span>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
