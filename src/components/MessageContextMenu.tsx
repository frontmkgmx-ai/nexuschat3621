import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reply, Copy, Trash2, Edit2, Share, SmilePlus, Download, ExternalLink, Info } from 'lucide-react';

export type ContextMenuPosition = { x: number; y: number };

interface MessageContextMenuProps {
  isOpen: boolean;
  message: any;
  isOwnMessage: boolean;
  position: ContextMenuPosition;
  onClose: () => void;
  onReply: () => void;
  onCopy?: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onReact?: (emoji: string) => void;
  onDownload?: () => void;
}

export default function MessageContextMenu({
  isOpen,
  message,
  isOwnMessage,
  position,
  onClose,
  onReply,
  onCopy,
  onDeleteForMe,
  onDeleteForEveryone,
  onEdit,
  onForward,
  onReact,
  onDownload
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContext = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('contextmenu', handleContext);
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate safe position to avoid going off screen
  let safeX = position.x;
  let safeY = position.y;
  
  // Hardcoded approximate menu dimensions
  const menuWidth = 220;
  const menuHeight = 350;

  if (typeof window !== 'undefined') {
    if (safeX + menuWidth > window.innerWidth) {
      safeX = window.innerWidth - menuWidth - 16;
    }
    if (safeY + menuHeight > window.innerHeight) {
      safeY = window.innerHeight - menuHeight - 16;
    }
  }

  const hasText = !!message.text?.trim();
  const hasFile = !!(message.file || (message.type && message.type !== 'text'));

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[9999] bg-[#18181b] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 flex flex-col min-w-[200px] text-[14px]"
        style={{ left: Math.max(16, safeX), top: Math.max(16, safeY) }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/10 gap-1 overflow-x-auto">
          {quickReactions.map(emoji => (
             <button 
               key={emoji} 
               onClick={() => { onReact?.(emoji); onClose(); }} 
               className="text-xl hover:scale-125 transition-transform flex-shrink-0 cursor-pointer"
             >
               {emoji}
             </button>
          ))}
        </div>

        <button onClick={() => { onReply(); onClose(); }} className="w-full px-4 py-2 mt-1 flex items-center gap-3 hover:bg-white/5 transition-colors text-zinc-200">
          <Reply className="w-4 h-4 text-zinc-400" /> Responder
        </button>
        
        {hasText && onCopy && (
          <button onClick={() => { onCopy(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-zinc-200">
            <Copy className="w-4 h-4 text-zinc-400" /> Copiar texto
          </button>
        )}

        {isOwnMessage && hasText && onEdit && (
          <button onClick={() => { onEdit(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-zinc-200">
            <Edit2 className="w-4 h-4 text-zinc-400" /> Editar
          </button>
        )}

        {hasFile && onDownload && (
          <button onClick={() => { onDownload(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-zinc-200">
            <Download className="w-4 h-4 text-zinc-400" /> Baixar
          </button>
        )}

        {onForward && (
          <button onClick={() => { onForward(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-zinc-200">
            <Share className="w-4 h-4 text-zinc-400" /> Encaminhar
          </button>
        )}

        <div className="h-[1px] bg-white/10 my-1.5 w-full" />

        <button onClick={() => { onDeleteForMe(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-red-400">
          <Trash2 className="w-4 h-4" /> Apagar para mim
        </button>

        {isOwnMessage && onDeleteForEveryone && (
          <button onClick={() => { onDeleteForEveryone(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-red-400">
            <Trash2 className="w-4 h-4" /> Apagar para todos
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
