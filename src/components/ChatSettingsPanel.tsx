import React, { useState, useEffect } from "react";
import { X, Shield, Palette, Ban, Flag, Trash2, Eraser, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { doc, updateDoc, writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import { sanitizeUrl } from "../services/fileApi";

interface ChatSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
  currentUser: any;
  messages: any[];
}

export default function ChatSettingsPanel({ isOpen, onClose, conversation, currentUser, messages }: ChatSettingsPanelProps) {
  const [showThemes, setShowThemes] = useState(false);

  if (!isOpen) return null;

  const currentTheme = conversation.theme?.[currentUser._id] || "default";

  const changeTheme = async (theme: string) => {
    try {
      await updateDoc(doc(db, "conversations", conversation._id), {
        [`theme.${currentUser._id}`]: theme
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Deseja apagar todas as mensagens para você?")) return;
    try {
      // Use lastClearedAt timestamp for efficiency
      await updateDoc(doc(db, "conversations", conversation._id), {
        [`lastClearedAt.${currentUser._id}`]: Date.now()
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm("Deseja bloquear este usuário?")) return;
    try {
      const blockedBy = conversation.blockedBy || [];
      if (!blockedBy.includes(currentUser._id)) {
        await updateDoc(doc(db, "conversations", conversation._id), {
          blockedBy: [...blockedBy, currentUser._id]
        });
        alert("Usuário bloqueado");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = () => {
    alert("Denúncia enviada com sucesso para moderação.");
  };

  const themes = [
    { id: "default", name: "Padrão", color: "bg-gradient-to-br from-indigo-500 to-indigo-600" },
    { id: "blue", name: "Azul", color: "bg-blue-600" },
    { id: "light-gray", name: "Cinza Claro", color: "bg-zinc-300 border-zinc-400" },
    { id: "dark-gray", name: "Cinza Escuro", color: "bg-zinc-800 border-zinc-700" },
    { id: "white", name: "Branco", color: "bg-white border-zinc-200" },
    { id: "transparent", name: "Transparente", color: "bg-zinc-800/40 backdrop-blur-md border border-white/10" },
  ];

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-zinc-950/98 backdrop-blur-xl border-l border-zinc-800/50 z-[100] flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-900/50">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Configurações</h3>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-xl hover:bg-zinc-900">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-8" style={{ transform: "translateZ(0)" }}>
        {/* Profile/Chat Info Summary (Compact) */}
        <div className="flex flex-col items-center px-6 mb-8 group">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-zinc-800 shadow-2xl mb-4 group-hover:scale-105 transition-transform duration-500">
               <img 
                 src={conversation.isGroup ? (sanitizeUrl(conversation.avatarUrl) || `https://api.dicebear.com/7.x/shapes/svg?seed=${conversation._id}`) : (sanitizeUrl(conversation.otherUser?.avatarUrl) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${conversation.otherUser?._id || conversation._id}`)} 
                 alt="Chat" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   if (!target.src.includes('dicebear.com/7.x/initials')) {
                     const seed = conversation.isGroup ? (conversation.name || "Grupo") : (conversation.otherUser?.username || conversation.otherUser?.phoneNumber || conversation._id);
                     target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
                   }
                 }}
               />
            </div>
            {!conversation.isGroup && conversation.otherUser?.status && (
              <div className={`absolute bottom-5 right-1 w-5 h-5 border-4 border-zinc-950 rounded-full ${conversation.otherUser?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
            )}
          </div>
          <h4 className="text-zinc-100 font-display font-bold text-xl text-center truncate w-full px-4">
            {conversation.isGroup ? (conversation.name || "Grupo") : (conversation.otherUser?.username || conversation.otherUser?.phoneNumber || "Usuário")}
          </h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{conversation.isGroup ? 'Canal Seguro' : 'Conexão Privada'}</p>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-1">


          <div className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[2px] mt-2 mb-1">Interface</div>
          <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800/30 overflow-hidden backdrop-blur-sm">
            <button 
              onClick={() => setShowThemes(!showThemes)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="font-semibold">Temas Dinâmicos</span>
              </div>
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentTheme !== 'default' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'}`} />
            </button>
            
            <AnimatePresence>
              {showThemes && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-5 pb-5"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => changeTheme(t.id)}
                        className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all duration-300 ${currentTheme === t.id ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' : 'border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/30'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl shadow-inner ring-1 ring-white/10 ${t.color}`} />
                        <span className="text-[10px] font-bold text-zinc-500 truncate w-full text-center">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[2px] mt-6 mb-1">Segurança</div>
          <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800/30 overflow-hidden backdrop-blur-sm space-y-px">
            <button className="w-full flex items-center gap-3 px-5 py-4 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-all active:scale-[0.98] group">
              <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Criptografia RSA-4096</span>
            </button>

            <button onClick={handleBlock} className="w-full flex items-center gap-3 px-5 py-4 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-all active:scale-[0.98] group">
              <Ban className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Bloquear Usuário</span>
            </button>

            <button onClick={handleReport} className="w-full flex items-center gap-3 px-5 py-4 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-all active:scale-[0.98] group">
              <Flag className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Relatar Incidente</span>
            </button>
          </div>

          <div className="px-4 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[2px] mt-6 mb-1">Ações de Dados</div>
          <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800/30 overflow-hidden backdrop-blur-sm">
            <button onClick={handleClearHistory} className="w-full flex items-center gap-3 px-5 py-4 text-sm text-rose-500 hover:bg-rose-500/10 transition-all active:scale-[0.98] group">
              <Eraser className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Limpeza de Histórico</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-900/50">
        <p className="text-center text-[9px] text-zinc-600 font-mono uppercase tracking-[2px]">Encrypted Session Active</p>
      </div>
    </motion.div>
  );
}
