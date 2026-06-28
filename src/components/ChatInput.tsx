import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";
import { db, rtdb } from "../lib/firebase";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { uploadChatImage, uploadChatVideo, uploadChatAudio, uploadChatDocument, uploadGroupImage, uploadGroupVideo, uploadGroupAudio, uploadGroupDocument } from "../services/storageService";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function ChatInput({ 
  currentUser, 
  conversation, 
  scrollToBottom,
  setUploadProgress,
  replyingTo,
  setReplyingTo,
  editingMsg,
  setEditingMsg,
  channelType
}: {
  currentUser: any;
  conversation: any;
  scrollToBottom: (instant?: boolean) => void;
  setUploadProgress: (updater: (prev: any) => any) => void;
  replyingTo?: any;
  setReplyingTo?: (val: any) => void;
  editingMsg?: any;
  setEditingMsg?: (val: any) => void;
  channelType?: string;
}) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
     if (conversation?._id && currentUser?._id) {
         const typingRef = ref(rtdb, `conversations/${conversation._id}/typing/${currentUser._id}`);
         if (isRecording) {
            set(typingRef, "recording");
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
         } else {
            set(typingRef, null);
         }
     }
  }, [isRecording, conversation?._id, currentUser?._id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setText(e.target.value);
     if (!conversation?._id || !currentUser?._id) return;
     
     if (!isRecording) {
         const typingRef = ref(rtdb, `conversations/${conversation._id}/typing/${currentUser._id}`);
         set(typingRef, "typing");
         
         if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
         typingTimeoutRef.current = setTimeout(() => {
            set(typingRef, null);
         }, 2000);
     }
  };

  // When editingMsg changes, load its text into input
  useEffect(() => {
    if (editingMsg) {
      setText(editingMsg.text || "");
    }
  }, [editingMsg]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !conversation) return;

    if (channelType === 'media' || channelType === 'links') {
        alert(`O canal selecionado (${channelType === 'media' ? 'Mídia' : 'Links'}) não permite envio de mensagens de texto avulsas. Por favor, envie diretamente o respectivo anexo.`);
        return;
    }

    const currentText = text.trim();
    setText("");

    try {
      if (editingMsg) {
        await updateDoc(doc(db, "messages", editingMsg._id), {
          text: currentText,
          edited: true
        });
        setEditingMsg?.(null);
        return;
      }

      if (conversation?._id && currentUser?._id) {
         set(ref(rtdb, `conversations/${conversation._id}/typing/${currentUser._id}`), null);
      }

      const messageId = crypto.randomUUID();
      const newMsg = {
        _id: messageId,
        conversationId: conversation._id,
        senderId: currentUser._id,
        text: currentText,
        status: "sending",
        _creationTime: Date.now(),
        ...(replyingTo ? {
          replyTo: {
            id: replyingTo._id,
            senderId: replyingTo.senderId,
            senderName: replyingTo.senderId === currentUser._id ? 'Você' : (conversation.isGroup ? 'Membro' : conversation.otherUser?.username || 'Outro usuário'),
            textPreview: replyingTo.text ? replyingTo.text.substring(0, 50) + (replyingTo.text.length > 50 ? '...' : '') : 'Mídia'
          }
        } : {})
      };
      
      await setDoc(doc(db, "messages", messageId), newMsg);
      await updateDoc(doc(db, "messages", messageId), { status: "sent" });
      await updateDoc(doc(db, "conversations", conversation._id), {
        lastMessage: newMsg,
        updatedAt: Date.now()
      });
      setReplyingTo?.(null);
      scrollToBottom(true);
      
      // Play send sound
      import("../services/soundService").then(s => s.soundService.playSend());
      
    } catch (e) {
      console.error(e);
      setText(currentText); // restore on fail
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;
    
    e.target.value = "";

    const mimeType = file.type;
    let type = "document";
    if (mimeType.startsWith("image/")) type = "image";
    else if (mimeType.startsWith("video/")) type = "video";
    else if (mimeType.startsWith("audio/")) type = "audio";

    // Generate small thumbnail for feedback
    let filePreview = "";
    if (type === "image") {
       try {
         filePreview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
               const img = new Image();
               img.onload = () => {
                   const canvas = document.createElement("canvas");
                   const max = 150;
                   let width = img.width;
                   let height = img.height;
                   if (width > height) {
                       if (width > max) {
                          height = Math.round((height *= max / width));
                          width = max;
                       }
                   } else {
                       if (height > max) {
                          width = Math.round((width *= max / height));
                          height = max;
                       }
                   }
                   canvas.width = width;
                   canvas.height = height;
                   const ctx = canvas.getContext("2d");
                   if(ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      resolve(canvas.toDataURL("image/jpeg", 0.4));
                   } else {
                      resolve("");
                   }
               };
               img.onerror = () => resolve("");
               if(ev.target?.result) {
                 img.src = ev.target.result as string;
               } else resolve("");
            };
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
         });
       } catch(e) {}
    }

    const messageId = crypto.randomUUID();
    const newMsg = {
      _id: messageId,
      conversationId: conversation._id,
      senderId: currentUser._id,
      type: type,
      status: "uploading",
      filePreview: filePreview || null,
      _creationTime: Date.now()
    };
    
    try {
      await setDoc(doc(db, "messages", messageId), newMsg);
      await updateDoc(doc(db, "conversations", conversation._id), {
        lastMessage: newMsg,
        updatedAt: Date.now()
      });
      scrollToBottom();

      const onProgress = (p: number) => {
        setUploadProgress(prev => ({ ...prev, [messageId]: p }));
      };

      let result;
      if (conversation.isGroup) {
        if (type === "image") result = await uploadGroupImage({ groupId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
        else if (type === "video") result = await uploadGroupVideo({ groupId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
        else if (type === "audio") result = await uploadGroupAudio({ groupId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
        else result = await uploadGroupDocument({ groupId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
      } else {
        if (type === "image") result = await uploadChatImage({ chatId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
        else if (type === "video") result = await uploadChatVideo({ chatId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
        else if (type === "audio") result = await uploadChatAudio({ chatId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
        else result = await uploadChatDocument({ chatId: conversation._id, userId: currentUser._id, messageId, file, onProgress });
      }

      await updateDoc(doc(db, "messages", messageId), {
        file: result.file,
        status: "sent"
      });
    } catch (error) {
      console.error("File upload failed", error);
      await updateDoc(doc(db, "messages", messageId), {
        status: "failed"
      });
    }
  };

  const cancelReplyEdit = () => {
    if (replyingTo) setReplyingTo?.(null);
    if (editingMsg) {
      setEditingMsg?.(null);
      setText("");
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelReplyEdit();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [replyingTo, editingMsg, setReplyingTo, setEditingMsg]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      cancelReplyEdit();
    }
  };

  return (
    <div className="flex flex-col z-10 w-full shrink-0 border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {(replyingTo || editingMsg) && (
        <div className="bg-[#18181b] px-4 py-2.5 flex items-center justify-between border-b border-white/5 relative shrink-0">
          <div className="flex items-center gap-3 overflow-hidden ml-10">
            <div className="min-w-[4px] h-8 bg-indigo-500 rounded-full" />
            <div className="flex flex-col flex-1 min-w-0 pr-4">
              <span className="text-indigo-400 text-xs font-semibold">
                {editingMsg ? "Editando mensagem" : `Respondendo a ${replyingTo.senderId === currentUser._id ? 'Você' : (conversation.isGroup ? 'Membro' : conversation.otherUser?.username || 'Outro usuário')}`}
              </span>
              <span className="text-zinc-400 text-xs truncate">
                {editingMsg ? editingMsg.text : (replyingTo.text || 'Mídia')}
              </span>
            </div>
          </div>
          <button onClick={cancelReplyEdit} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <div className="bg-[#0a0a0c]/80 backdrop-blur-xl px-4 py-3 sm:py-4 flex items-center h-[72px] sm:h-[84px] relative">
        <div className="flex items-center gap-2 text-zinc-400 mr-2 sm:mr-3 relative" ref={emojiPickerRef}>
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full hover:bg-white/5 hover:text-indigo-400 transition-colors block"
          >
            <Smile className="w-[22px] h-[22px]" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-[60px] left-0 z-50 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
               <EmojiPicker 
                 theme={Theme.DARK}
                 onEmojiClick={(emojiData) => {
                   setText(prev => prev + emojiData.emoji);
                 }}
               />
            </div>
          )}

          <label className={`p-2 rounded-full hover:bg-white/5 transition-colors block ${channelType === 'logs' ? 'text-zinc-600 cursor-not-allowed' : 'cursor-pointer hover:text-indigo-400 text-zinc-400'}`}>
            <Paperclip className="w-[22px] h-[22px]" />
            <input type="file" className="hidden" onChange={handleFileUpload} accept={channelType === 'media' ? "image/*,video/*" : channelType === 'links' ? ".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.apk" : "*/*"} disabled={channelType === 'logs'} />
          </label>
        </div>
        <form onSubmit={handleSend} className="flex-1 relative">
          <input
            type="text"
            className="w-full bg-[#18181b] border border-white/10 rounded-full px-5 py-3.5 focus:outline-none focus:border-indigo-500/50 focus:bg-[#1f1f22] text-zinc-100 placeholder-zinc-500 transition-all text-[15px] shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={channelType === 'logs' ? "Somente logs..." : channelType === 'media' ? "Envie arquivos de mídia..." : channelType === 'links' ? "Envie arquivos e links..." : "Digite uma mensagem..."}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={channelType === 'media' || channelType === 'links'}
          />
        </form>
        <div className={`flex items-center transition-colors ml-2 sm:ml-3 z-20`}>
          {text.trim() ? (
            <button onClick={() => handleSend()} className="bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] p-3.5 rounded-full cursor-pointer transition-all block">
              <Send className="w-[18px] h-[18px] ml-0.5" />
            </button>
          ) : (
            <button 
              type="button" 
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              onMouseLeave={() => setIsRecording(false)}
              onTouchStart={() => setIsRecording(true)}
              onTouchEnd={() => setIsRecording(false)}
              className={`p-3.5 rounded-full cursor-pointer transition-all block ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#18181b] border border-white/5 text-zinc-400 hover:text-indigo-400'}`}
            >
              <Mic className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
