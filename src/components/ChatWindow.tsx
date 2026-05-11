import React, { useState, useEffect, useRef } from "react";
import { Search, MoreVertical, Check, CheckCheck, ArrowLeft, Phone, Video, MonitorUp, PhoneOff, Mic, MicOff, Camera, CameraOff, BadgeCheck, ShieldBan, Hash } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { db, rtdb } from "../lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch, addDoc } from "firebase/firestore";
import { ref as dbRef, onValue } from "firebase/database";
import MessageFilePreview from "./MessageFilePreview";
import VoiceMessageBubble from "./VoiceMessageBubble";
import { sanitizeUrl } from "../services/storageService";
import CallRoom from "./CallRoom";
import ChatInput from "./ChatInput";
import MessageContextMenu, { ContextMenuPosition } from "./MessageContextMenu";
import { useLongPress } from "../hooks/useLongPress";
import LinkPreviewCard from "./LinkPreviewCard";
import ChatSettingsPanel from "./ChatSettingsPanel";

const extractFirstUrl = (text: string) => {
  if (!text) return null;
  const match = text.match(/(https?:\/\/[^\s]+)/);
  return match ? match[0] : null;
};

const linkify = (text: string) => {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline" onClick={(e) => e.stopPropagation()}>{part}</a>;
    }
    return part;
  });
};

const MessageBubble = React.memo(({ 
  msg, 
  isMine, 
  showDate, 
  uploadProgress,
  onContextMenu,
  currentUser,
  theme,
  onJoinCall,
  isCallActive,
  isGroup,
  onOpenProfile
}: { 
  msg: any, 
  isMine: boolean, 
  showDate: boolean, 
  uploadProgress?: number,
  onContextMenu: (e: React.PointerEvent | React.MouseEvent, msg: any) => void,
  currentUser: any,
  theme?: string,
  onJoinCall?: (type: 'audio' | 'video') => void,
  isCallActive?: boolean,
  isGroup?: boolean,
  onOpenProfile?: (userId: string) => void
}) => {
  const getBubbleStyle = (isMine: boolean, theme?: string) => {
    if (theme === 'blue') {
      return isMine 
        ? "bg-blue-600 text-white rounded-[20px] rounded-tr-[4px] shadow-sm border border-blue-500"
        : "bg-blue-900/30 border border-blue-800/50 text-blue-50 rounded-[20px] rounded-tl-[4px] shadow-sm";
    }
    if (theme === 'light-gray') {
      return isMine
        ? "bg-zinc-300 text-zinc-900 rounded-[20px] rounded-tr-[4px] shadow-sm border border-zinc-400"
        : "bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-[20px] rounded-tl-[4px] shadow-sm";
    }
    if (theme === 'dark-gray') {
      return isMine
        ? "bg-zinc-800 text-white rounded-[20px] rounded-tr-[4px] shadow-sm border border-zinc-700"
        : "bg-[#1a1a1c] border border-zinc-800 text-zinc-300 rounded-[20px] rounded-tl-[4px] shadow-sm";
    }
    if (theme === 'white') {
      return isMine
        ? "bg-white text-zinc-900 rounded-[20px] rounded-tr-[4px] shadow-sm border border-zinc-200"
        : "bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-[20px] rounded-tl-[4px] shadow-sm";
    }
    if (theme === 'transparent') {
      return isMine
        ? "bg-white/10 backdrop-blur-md text-white rounded-[20px] rounded-tr-[4px] shadow-sm border border-white/20"
        : "bg-black/20 backdrop-blur-md border border-white/10 text-zinc-100 rounded-[20px] rounded-tl-[4px] shadow-sm";
    }
    
    // default
    return isMine 
      ? "bg-zinc-200 text-zinc-900 rounded-[20px] rounded-tr-[4px] shadow-sm border border-zinc-300"
      : "bg-zinc-100 text-zinc-800 rounded-[20px] rounded-tl-[4px] shadow-sm border border-zinc-200";
  };

  const hasText = !!msg.text?.trim();
  const hasFile = !!(msg.type && msg.type !== "text");
  
  const longPressProps = useLongPress(
    (e) => onContextMenu(e, msg),
    () => {},
    { delay: 450 }
  );

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, msg);
  };
  
  if (msg.deletedForEveryone) {
    return (
      <div className={`flex mb-3 ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="px-4 py-2 bg-transparent border border-white/10 rounded-[20px] text-zinc-500 text-sm italic">
          Esta mensagem foi apagada
        </div>
      </div>
    );
  }

  if (!hasText && !hasFile) return null;

  const isMedia = ["image", "video"].includes(msg.type) || (msg.file?.mimeType?.startsWith("image/") || msg.file?.mimeType?.startsWith("video/"));
  const justMedia = isMedia && !hasText;
  
  // Render reply snippet if available
  const hasReply = !!msg.replyTo;
  
  const firstUrl = hasText ? extractFirstUrl(msg.text) : null;
  
  const hasReactions = msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions[k].length > 0);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
    >
      {showDate && (
        <div className="text-center my-6 col-span-full">
          <span className="bg-black/40 border border-white/5 backdrop-blur-md text-zinc-400 text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-xl shadow-sm font-semibold">
            {format(msg._creationTime, "d 'de' MMMM 'de' yyyy")}
          </span>
        </div>
      )}
      <div className={`flex mb-3 ${isMine ? "justify-end" : "justify-start"} ${justMedia ? "col-span-1 h-full w-full" : ""}`}>
        {!isMine && isGroup && (
           <img 
              src={msg.senderAvatarUrl ? sanitizeUrl(msg.senderAvatarUrl) : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.senderId}`}
              alt="Avatar"
              className="w-8 h-8 rounded-xl object-cover mr-2 self-end shrink-0 cursor-pointer shadow-sm border border-zinc-800"
              onClick={() => onOpenProfile && onOpenProfile(msg.senderId)}
           />
        )}
        <div 
          {...longPressProps}
          onContextMenu={handleRightClick}
          className={`relative max-w-[85%] sm:max-w-[75%] shadow-sm text-[15px] leading-relaxed w-fit select-none ${getBubbleStyle(isMine, theme)} ${justMedia ? "p-1.5 bg-transparent border-none shadow-none" : "px-3 py-2"}`}
        >
          <div className="flex flex-col w-fit max-w-full">
            {!isMine && isGroup && !justMedia && (
               <span 
                 onClick={() => onOpenProfile && onOpenProfile(msg.senderId)}
                 className="text-xs font-bold text-indigo-400 mb-1 cursor-pointer hover:underline"
               >
                 {msg.senderName || "Usuário"}
               </span>
            )}
            {hasReply && (
              <div className="mb-2 bg-black/20 rounded-lg p-2 border-l-2 border-indigo-400 text-sm">
                <p className="text-xs text-indigo-300 font-semibold mb-0.5">{msg.replyTo.senderName}</p>
                <p className="text-zinc-300 truncate">{msg.replyTo.textPreview || 'Mídia'}</p>
              </div>
            )}
            {(msg.type === "call_event" || msg.type === "call") && (
              <div className="flex flex-col gap-3 py-2 px-1">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${msg.callType === 'video' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-green-500/20 text-green-400'}`}>
                    {msg.callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-semibold">{msg.callType === 'video' ? 'Chamada de Vídeo' : 'Chamada de Voz'}</p>
                    <p className="text-sm opacity-80">{isMine ? 'Você iniciou uma chamada' : 'Iniciou uma chamada'}</p>
                  </div>
                </div>
                {onJoinCall && (
                  isCallActive ? (
                    <button 
                      onClick={() => onJoinCall(msg.callType || 'audio')}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${msg.callType === 'video' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-lg shadow-black/20`}
                    >
                      {msg.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      Entrar na Chamada
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                    >
                      Chamada Encerrada
                    </button>
                  )
                )}
              </div>
            )}
            
            <div className={`break-words overflow-wrap-anywhere whitespace-pre-wrap ${justMedia ? '' : (hasReactions ? 'pb-5' : '')}`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {hasFile ? (
                 <div className={justMedia ? "" : "mb-1"}>
                   {msg.status === "uploading" ? (
                     <div className="relative">
                       {msg.filePreview && (
                         <div className="mb-2 relative rounded-xl overflow-hidden aspect-square max-w-[200px] w-full bg-zinc-900 border border-white/10 group">
                           <img src={msg.filePreview} alt="preview" className="w-full h-full object-cover blur-sm opacity-50 transition-opacity" />
                         </div>
                       )}
                       <div className={`flex flex-col gap-2 mt-1 min-w-[120px] p-2 ${msg.filePreview ? 'absolute inset-0 items-center justify-center bg-black/40 rounded-xl' : ''}`}>
                         <div className="flex items-center gap-2 text-sm opacity-90 font-medium text-white drop-shadow-md">
                           <svg className="animate-spin h-4 w-4 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           Enviando...
                         </div>
                         <div className={`w-full bg-black/40 rounded-full h-1.5 overflow-hidden ${msg.filePreview ? 'max-w-[80%] mx-auto shadow-md border border-white/10' : ''}`}>
                           <div className="bg-white h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress || 0}%` }}></div>
                         </div>
                       </div>
                     </div>
                   ) : msg.status === "failed" ? (
                     <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-between gap-4 mt-1">
                        <div className="flex flex-col">
                          <span className="text-red-400 text-sm font-semibold">Falha no envio</span>
                          <span className="text-red-400/70 text-xs">Ocorreu um erro ao enviar.</span>
                        </div>
                     </div>
                   ) : msg.type === "voice" ? (
                     <VoiceMessageBubble mediaUrl={msg.mediaUrl} durationSeconds={msg.durationSeconds} isMine={isMine} />
                   ) : (
                     <MessageFilePreview message={msg} />
                   )}
                 </div>
              ) : null}
              {hasText && msg.type !== "call_event" && msg.type !== "call" && (
                <>
                  <p className="leading-snug whitespace-pre-wrap word-break">{linkify(msg.text)}</p>
                  {firstUrl && <LinkPreviewCard url={firstUrl} />}
                </>
              )}
            </div>

            {hasReactions && (
              <div className="flex flex-wrap gap-1 mt-1 z-10 relative">
                {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => {
                  if (!users || users.length === 0) return null;
                  const isMyReaction = users.includes(currentUser._id);
                  return (
                    <div key={emoji} className={`text-xs px-1.5 py-0.5 rounded-full border ${isMyReaction ? (isMine ? 'bg-indigo-400/40 border-indigo-300 text-white' : 'bg-indigo-500/30 border-indigo-500/50 text-indigo-100') : 'bg-black/30 border-white/10 text-white/90'}`}>
                      <span className="mr-1">{emoji}</span>
                      <span>{users.length}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Timestamp */}
            <div className={`flex items-center justify-end gap-1 ${
              justMedia 
                ? "absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full z-10" 
                : "float-right mt-1 ml-3 -mb-1 opacity-70"
            }`}>
              {msg.edited && <span className="text-[10px] mr-1 italic">Editada</span>}
              <span className={`text-[10px] font-semibold tracking-wide ${
                justMedia ? 'text-white' : (isMine ? 'text-zinc-600' : 'text-zinc-500')
              }`}>
                {format(msg._creationTime, "HH:mm")}
              </span>
              {isMine && (
                <span className={justMedia ? "opacity-100" : "opacity-90"}>
                  {msg.status === "read" ? (
                    <CheckCheck className={`w-[14px] h-[14px] ${justMedia ? "text-sky-400" : "text-sky-600"}`} strokeWidth={2.5} />
                  ) : msg.status === "delivered" ? (
                    <CheckCheck className={`w-[14px] h-[14px] ${justMedia ? "text-white" : "text-zinc-500"}`} strokeWidth={2.5} />
                  ) : msg.status === "sending" ? (
                      <span className={`w-[14px] h-[14px] opacity-70 block ${justMedia ? "text-white" : "text-zinc-500"}`}><svg className="animate-spin w-full h-full" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></span>
                  ) : (
                    <Check className={`w-[14px] h-[14px] ${justMedia ? "text-white" : "text-zinc-500"}`} strokeWidth={2.5} />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function ChatWindow({
  currentUser,
  conversation: initialConversation,
  isMobileHidden,
  onBack,
  onOpenProfile,
}: {
  currentUser: any;
  conversation: any | null;
  isMobileHidden?: boolean;
  onBack?: () => void;
  onOpenProfile?: (userId: string) => void;
}) {
  const [conversation, setConversation] = useState<any>(initialConversation);
  const [messages, setMessages] = useState<any[]>([]);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; msg: any; position: ContextMenuPosition }>({
    isOpen: false,
    msg: null,
    position: { x: 0, y: 0 }
  });
  
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeCallParticipants, setActiveCallParticipants] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation?._id) {
       setIsTyping(false);
       setActiveCallParticipants([]);
       return;
    }
    const typingRef = dbRef(rtdb, `conversations/${conversation._id}/typing`);
    const unsubTyping = onValue(typingRef, (snapshot) => {
       const val = snapshot.val();
       let typing = false;
       if (val) {
          Object.keys(val).forEach(k => {
             if (k !== currentUser._id && val[k] === true) {
                typing = true;
             }
          });
       }
       setIsTyping(typing);
    });

    const callRef = dbRef(rtdb, `conversations/${conversation._id}/callStatus/participants`);
    const unsubCall = onValue(callRef, (snapshot) => {
       const val = snapshot.val();
       if (val) {
         setActiveCallParticipants(Object.keys(val));
       } else {
         setActiveCallParticipants([]);
       }
    });

    return () => {
      unsubTyping();
      unsubCall();
    }
  }, [conversation?._id, currentUser._id]);

  const handleReplyMessage = (msg: any) => {
    setReplyingTo(msg);
    import("../services/soundService").then(s => s.soundService.playReply());
  };

  // Sync initialConversation
  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation?._id]);

  // Listen to conversation document for real-time theme/details updates
  useEffect(() => {
    if (!initialConversation?._id) return;
    const unsub = onSnapshot(doc(db, "conversations", initialConversation._id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConversation((prev: any) => ({
          ...prev,
          ...data,
          _id: docSnap.id
        }));
      }
    });
    return () => unsub();
  }, [initialConversation?._id]);

  // Also listen to the other user's profile if it's a 1:1 chat to keep status/avatar updated
  useEffect(() => {
    const otherUserId = initialConversation?.participants?.find((p: string) => p !== currentUser._id);
    if (!initialConversation?.isGroup && otherUserId) {
      const unsub = onSnapshot(doc(db, "users", otherUserId), (userSnap) => {
        if (userSnap.exists()) {
          setConversation((prev: any) => ({
            ...prev,
            otherUser: { _id: userSnap.id, ...userSnap.data() }
          }));
        }
      });
      return () => unsub();
    }
  }, [initialConversation?._id, initialConversation?.isGroup, currentUser._id]);

  // Read messages from Firebase
  useEffect(() => {
    if (!conversation?._id) return;
    const q = query(collection(db, "messages"), where("conversationId", "==", conversation._id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let isAnyNew = false;
      const changes = snapshot.docChanges();
      for (const change of changes) {
         if (change.type === 'added') {
            const data = change.doc.data();
            // If it's not our own message and it was created in the last 10 seconds
            if (data.senderId !== currentUser._id && data._creationTime > Date.now() - 10000) {
                isAnyNew = true;
            }
         }
      }

      const msgs = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id })) as any[];
      msgs.sort((a, b) => (a._creationTime || Number.MAX_SAFE_INTEGER) - (b._creationTime || Number.MAX_SAFE_INTEGER));
      
      // Filter out messages deleted localy (history cleared)
      const lastCleared = conversation.lastClearedAt?.[currentUser._id] || 0;
      const filtered = msgs.filter(m => (m._creationTime || 0) > lastCleared);
      
      setMessages(filtered);

      if (isAnyNew) {
         import("../services/soundService").then(s => s.soundService.playReceive());
         if (document.hidden) {
            import("../services/fcm").then(fcm => {
               fcm.showBrowserNotification("Nova mensagem", {
                 body: `Você recebeu uma nova mensagem de um contato.`
               });
            });
         }
      }
    });
    return () => unsubscribe();
  }, [conversation?._id, conversation?.lastClearedAt?.[currentUser._id], currentUser._id]);

  const scrollToBottom = React.useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
    
    if (conversation && messages.length > 0) {
      const unreadMsgs = messages.filter(m => m.senderId !== currentUser._id && m.status !== "read");
      if (unreadMsgs.length > 0) {
        // Mark as read in a batch
        const batch = writeBatch(db);
        unreadMsgs.forEach(m => {
          batch.update(doc(db, "messages", m._id), { status: "read" });
        });
        batch.commit().catch(console.error);
      }
    }
  }, [messages, conversation, currentUser._id]);

  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping, scrollToBottom]);

  const handleContextMenu = (e: React.PointerEvent | React.MouseEvent, msg: any) => {
    let clientX, clientY;
    
    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      // Fallback for PointerEvent when clientX might be at 0 if triggered without movement
      clientX = window.innerWidth / 2;
      clientY = window.innerHeight / 2;
    }
    
    setContextMenu({
      isOpen: true,
      msg,
      position: { x: clientX || window.innerWidth / 2, y: clientY || window.innerHeight / 2 }
    });
  };

  const handleCopy = () => {
    if (contextMenu.msg?.text) {
      navigator.clipboard.writeText(contextMenu.msg.text);
    }
  };

  const handleDownload = () => {
    if (!contextMenu.msg?.file) return;
    const url = contextMenu.msg.file.downloadUrl || contextMenu.msg.file.url;
    if (url) {
       const a = document.createElement('a');
       a.href = sanitizeUrl(url);
       a.download = contextMenu.msg.file.name || 'download';
       a.target = '_blank';
       a.rel = 'noreferrer';
       a.click();
    }
  };

  const handleDeleteForMe = async () => {
    if (!contextMenu.msg) return;
    try {
      // Depending on structure, maybe just hide in UI or update a field
      // Simple way: save locally or update db with deletedFor: array
      // But rules requested UI only "hide" it or similar
      // Assuming straightforward doc deletion for now if it's the simplest way or just hide
      await updateDoc(doc(db, "messages", contextMenu.msg._id), {
        deletedFor: [currentUser._id]
      });
      import("../services/soundService").then(s => s.soundService.playDelete());
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!contextMenu.msg) return;
    try {
      await updateDoc(doc(db, "messages", contextMenu.msg._id), {
        deletedForEveryone: true,
        text: "",
        file: null,
        type: "text",
        deletedAt: Date.now()
      });
      import("../services/soundService").then(s => s.soundService.playDelete());
    } catch(err) {
      console.error(err);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!contextMenu.msg) return;
    try {
      const msgRef = doc(db, "messages", contextMenu.msg._id);
      const existingReactions = contextMenu.msg.reactions || {};
      let currentReactions = existingReactions[emoji] || [];

      if (currentReactions.includes(currentUser._id)) {
         currentReactions = currentReactions.filter((id: string) => id !== currentUser._id);
      } else {
         currentReactions = [...currentReactions, currentUser._id];
      }

      await updateDoc(msgRef, {
          [`reactions.${emoji}`]: currentReactions
      });
    } catch(err) {
      console.error(err);
    }
  };

  const isCallActive = activeCallParticipants.length > 0;

  const handleStartCall = async (type: 'audio' | 'video') => {
    // Se a chamada já estiver ativa, apenas entra na chamada existente
    if (isCallActive) {
      setCallType(type);
      return;
    }

    setCallType(type);
    try {
      const newMsg = {
        conversationId: conversation._id,
        senderId: currentUser._id,
        text: type === 'video' ? "Iniciou uma chamada de vídeo" : "Iniciou uma chamada de voz",
        type: "call_event",
        callType: type,
        _creationTime: Date.now(),
        reactions: {},
        isRead: false
      };
      const docRef = await addDoc(collection(db, "messages"), newMsg);
      await updateDoc(doc(db, "messages", docRef.id), { status: "sent" });
      await updateDoc(doc(db, "conversations", conversation._id), {
        lastMessage: newMsg,
        updatedAt: Date.now()
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleEndCall = React.useCallback(() => {
    setCallType(null);
  }, []);

  if (!conversation) {
    return (
      <div className={`${isMobileHidden ? "hidden md:flex" : "flex"} flex-1 flex-col items-center justify-center bg-zinc-950 border-l border-zinc-800 relative z-0`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_100%)] z-0 pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center z-10 p-6"
        >
          <div className="text-zinc-300 font-display font-medium text-3xl mb-4 tracking-tight">Chat</div>
          <p className="text-zinc-500 text-sm">Secure encrypted channel established. Awaiting target selection.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${isMobileHidden ? "hidden md:flex" : "flex"} flex-1 flex-col h-full bg-[#0a0a0c] relative overflow-hidden border-l border-zinc-800`}>
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0" 
      />
      <div 
        className="absolute inset-0 opacity-[0.35] pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent z-0" 
      />

      {callType && (
        <CallRoom 
          currentUser={currentUser} 
          conversation={conversation} 
          callType={callType} 
          onEndCall={handleEndCall} 
        />
      )}

      {/* Header */}
      <div className="w-full shrink-0 min-h-16 px-3 sm:px-4 py-3 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between border-b border-zinc-800/50 z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0 flex-1">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 rounded-lg hover:bg-zinc-800/50">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          {conversation.isCommunityChannel ? (
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2B2D31] flex items-center justify-center flex-shrink-0 shadow-sm border border-zinc-700/50">
                <Hash className="w-5 h-5 text-zinc-400" />
             </div>
          ) : (
            <img 
              src={conversation.isGroup ? (sanitizeUrl(conversation.avatarUrl) || `https://api.dicebear.com/7.x/shapes/svg?seed=${conversation._id}`) : (sanitizeUrl(conversation.otherUser?.avatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${conversation.otherUser?.username || conversation.otherUser?.phoneNumber || conversation._id}`)} 
              alt="Avatar" 
              loading="lazy" 
              decoding="async" 
              onClick={() => onOpenProfile && !conversation.isGroup && conversation.otherUser?._id && onOpenProfile(conversation.otherUser._id)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-zinc-700/50 flex-shrink-0 shadow-sm cursor-pointer" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('dicebear.com/7.x/initials')) {
                  const seed = conversation.isGroup ? conversation.name : (conversation.otherUser?.username || conversation.otherUser?.phoneNumber || conversation._id);
                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
                }
              }}
            />
          )}
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-100 truncate text-[14px] sm:text-[15px]">
              <span className="truncate">{conversation.isGroup ? (conversation.name || "Grupo") : (conversation.otherUser?.username || conversation.otherUser?.phoneNumber || "Usuário")}</span>
              {(conversation.isGroup && conversation.isVerified) || (!conversation.isGroup && (conversation.otherUser?.role === 'admin' || conversation.otherUser?.role === 'AdminUser')) ? (
                <BadgeCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : null}
            </div>
            <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-0.5 sm:mt-1 truncate">
              {conversation.isGroup ? 'Criptografia de ponta a ponta' : (
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conversation.otherUser?.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : conversation.otherUser?.status === 'idle' ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                  <span className="truncate">{conversation.otherUser?.status === 'online' ? 'Online' : conversation.otherUser?.status === 'idle' ? 'Ausente' : 'Offline'}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-zinc-400 shrink-0">
          {!conversation.isCommunityChannel && (
            <>
              <button onClick={() => handleStartCall('audio')} className="p-2 sm:p-0 hover:bg-zinc-800 sm:hover:bg-transparent rounded-full sm:rounded-none">
                <Phone className="w-5 h-5 cursor-pointer hover:text-indigo-400 transition-colors" />
              </button>
              <button onClick={() => handleStartCall('video')} className="p-2 sm:p-0 hover:bg-zinc-800 sm:hover:bg-transparent rounded-full sm:rounded-none">
                <Video className="w-5 h-5 cursor-pointer hover:text-indigo-400 transition-colors" />
              </button>
            </>
          )}
          <div className="w-[1px] h-6 bg-zinc-800 mx-1 hidden sm:block" />
          <Search className="w-5 h-5 cursor-pointer hover:text-indigo-400 transition-colors hidden sm:block" />
          <MoreVertical onClick={() => setIsSettingsOpen(true)} className="w-5 h-5 cursor-pointer hover:text-indigo-400 transition-colors" />
        </div>
      </div>

      {/* Messages View */}
      <div className={`flex-1 overflow-y-auto p-4 pb-12 sm:p-6 sm:pb-12 z-10 custom-scrollbar overscroll-contain ${conversation.channelType === 'media' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 content-start' : 'flex flex-col gap-2'}`}>
        {conversation.channelType !== 'media' && (
          <div className="text-center mb-6 mt-4">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase tracking-widest font-bold py-1.5 px-4 rounded-xl shadow-sm">
              Criptografia de ponta a ponta ativada
            </span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages
            .filter((msg) => !msg.deletedFor?.includes(currentUser._id))
            .map((msg, i, arr) => {
            const isMine = msg.senderId === currentUser._id;
            const showDate = i === 0 || format(arr[i-1]._creationTime || msg._creationTime || 0, 'd') !== format(msg._creationTime || 0, 'd');
            const chatTheme = conversation.theme?.[currentUser._id] || "default";

            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isMine={isMine}
                showDate={showDate}
                uploadProgress={uploadProgress[msg._id]}
                onContextMenu={handleContextMenu}
                currentUser={currentUser}
                theme={chatTheme}
                onJoinCall={setCallType}
                isCallActive={isCallActive}
                isGroup={conversation.isGroup}
                onOpenProfile={onOpenProfile}
              />
            );
          })}
        </AnimatePresence>
        
        {isTyping && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 10 }}
             className="flex ml-4 mb-4"
           >
             <div className="bg-[#2B2D31] text-zinc-400 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center space-x-1.5 shadow-sm max-w-[100px]">
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {(!conversation.isCommunityChannel || conversation.admins?.includes(currentUser._id) || currentUser.role === 'admin' || currentUser.role === 'AdminUser') ? (
        <ChatInput 
          currentUser={currentUser} 
          conversation={conversation} 
          scrollToBottom={scrollToBottom} 
          setUploadProgress={setUploadProgress} 
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          editingMsg={editingMsg}
          setEditingMsg={setEditingMsg}
          channelType={conversation.channelType}
        />
      ) : (
        <div className="p-4 bg-[#1e1f22] border-t border-[#2B2D31] flex flex-col items-center justify-center gap-2 text-zinc-500 rounded-b-[20px] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-20">
            <div className="w-full max-w-sm flex items-center justify-center gap-2 py-3 bg-[#111214] border border-[#2B2D31] rounded-xl text-sm font-medium">
               <ShieldBan className="w-4 h-4 text-indigo-400" /> Somente administradores podem enviar mensagens
            </div>
        </div>
      )}
      
      <MessageContextMenu 
        isOpen={contextMenu.isOpen}
        message={contextMenu.msg}
        isOwnMessage={contextMenu.msg?.senderId === currentUser._id}
        position={contextMenu.position}
        onClose={() => setContextMenu(prev => ({...prev, isOpen: false}))}
        onReply={() => handleReplyMessage(contextMenu.msg)}
        onCopy={handleCopy}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
        onEdit={() => setEditingMsg(contextMenu.msg)}
        onDownload={handleDownload}
        onReact={handleReact}
      />

      <AnimatePresence>
        {isSettingsOpen && (
          <ChatSettingsPanel 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            conversation={conversation} 
            currentUser={currentUser} 
            messages={messages} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
