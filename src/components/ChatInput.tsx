import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic, Square, Trash, Play, Pause } from "lucide-react";
import { db } from "../lib/firebase";
import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { uploadChatImage, uploadChatVideo, uploadChatAudio, uploadChatDocument, uploadGroupImage, uploadGroupVideo, uploadGroupAudio, uploadGroupDocument, uploadVoiceToStorage } from "../services/fileApi";
import { useVoiceRecorder, formatDuration } from "../hooks/useVoiceRecorder";
import { VoicePreview } from "./VoiceRecorderButton";

export default function ChatInput({ 
  currentUser, 
  conversation, 
  scrollToBottom,
  setUploadProgress,
  replyingTo,
  setReplyingTo,
  editingMsg,
  setEditingMsg
}: {
  currentUser: any;
  conversation: any;
  scrollToBottom: (instant?: boolean) => void;
  setUploadProgress: (updater: (prev: any) => any) => void;
  replyingTo?: any;
  setReplyingTo?: (val: any) => void;
  editingMsg?: any;
  setEditingMsg?: (val: any) => void;
}) {
  const [text, setText] = useState("");
  
  const { 
      status, 
      setStatus,
      audioBlob, 
      audioUrl, 
      durationSeconds, 
      errorMsg, 
      startRecording, 
      stopRecording, 
      cancelRecording,
      resetRecording 
  } = useVoiceRecorder(300);

  const isRecording = status === "recording";
  const isPreview = status === "preview";
  const isUploading = status === "uploading";

  // When editingMsg changes, load its text into input
  useEffect(() => {
    if (editingMsg) {
      setText(editingMsg.text || "");
    }
  }, [editingMsg]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !conversation) return;

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

      const newMsg = {
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
      
      const docRef = await addDoc(collection(db, "messages"), newMsg);
      await updateDoc(doc(db, "messages", docRef.id), { status: "sent" });
      await updateDoc(doc(db, "conversations", conversation._id), {
        lastMessage: newMsg,
        updatedAt: Date.now()
      });
      setReplyingTo?.(null);
      scrollToBottom(true);
    } catch (e) {
      console.error(e);
      setText(currentText); // restore on fail
    }
  };

  const handleSendVoice = async () => {
      if (!audioBlob || !conversation || !currentUser) return;
      
      try {
          setStatus("uploading");
          const messageId = crypto.randomUUID();
          
          const result = await uploadVoiceToStorage(conversation._id, messageId, audioBlob);
          
          const newMsg = {
              _id: messageId, // Add _id explicitly to match doc Ref
              conversationId: conversation._id,
              senderId: currentUser._id,
              type: "voice",
              text: null,
              mediaUrl: result.url,
              mediaPath: result.path,
              mediaType: result.mimeType,
              durationSeconds: durationSeconds,
              fileSize: result.size,
              storageProvider: "supabase",
              bucket: "chatgeral",
              status: "sent",
              _creationTime: Date.now()
          };
          
          const docRef = await addDoc(collection(db, "messages"), newMsg);
          
          await updateDoc(doc(db, "conversations", conversation._id), {
              lastMessage: newMsg,
              updatedAt: Date.now()
          });

          scrollToBottom(true);
          resetRecording();
      } catch (err) {
          console.error("Failed to send voice message:", err);
          setStatus("error");
          alert("Falha ao enviar áudio. Tente novamente.");
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

    const messageId = crypto.randomUUID();
    const newMsg = {
      _id: messageId,
      conversationId: conversation._id,
      senderId: currentUser._id,
      type: type,
      status: "uploading",
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      cancelReplyEdit();
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      if (status !== 'idle' && status !== 'error') return;
      startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
      if (isRecording) {
         stopRecording();
      }
  };
  
  const handleMouseLeave = () => {
      if (isRecording) {
          stopRecording();
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
        {isPreview && audioUrl ? (
          <div className="flex-1 w-full flex items-center justify-center relative z-20">
            <VoicePreview 
              audioUrl={audioUrl} 
              durationSeconds={durationSeconds} 
              onCancel={cancelRecording} 
              onSend={handleSendVoice} 
              isUploading={isUploading} 
            />
          </div>
        ) : isRecording ? (
          <div className="flex-1 flex items-center bg-[#1f1f22]/80 border border-white/10 rounded-full px-5 py-3 h-[46px] ml-1 mr-3 gap-3 animate-pulse relative z-10 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-red-400 font-medium text-sm">Gravando áudio</span>
            <span className="text-zinc-300 font-mono text-sm ml-auto">{formatDuration(durationSeconds)}</span>
            <button onClick={cancelRecording} className="ml-4 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors">
              <Trash className="w-[18px] h-[18px]" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-zinc-400 mr-2 sm:mr-3">
              <button type="button" className="p-2 rounded-full hover:bg-white/5 hover:text-indigo-400 transition-colors hidden sm:block">
                <Smile className="w-[22px] h-[22px]" />
              </button>
              <label className="cursor-pointer p-2 rounded-full hover:bg-white/5 hover:text-indigo-400 transition-colors block">
                <Paperclip className="w-[22px] h-[22px]" />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <form onSubmit={handleSend} className="flex-1 relative">
              <input
                type="text"
                className="w-full bg-[#18181b] border border-white/10 rounded-full px-5 py-3.5 focus:outline-none focus:border-indigo-500/50 focus:bg-[#1f1f22] text-zinc-100 placeholder-zinc-500 transition-all text-[15px] shadow-inner"
                placeholder="Digite uma mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </form>
          </>
        )}
        {!isPreview && (
          <div className={`flex items-center ${text.trim() ? "text-indigo-500" : "text-zinc-600"} transition-colors ml-2 sm:ml-3 z-20`}>
            {text.trim() && !isRecording ? (
              <button onClick={() => handleSend()} className="bg-indigo-600 p-3.5 rounded-full cursor-pointer hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] block">
                <Send className="w-[18px] h-[18px] ml-0.5" />
              </button>
            ) : (
              <div 
                className={`p-3.5 rounded-full cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-zinc-400 select-none touch-none ${isRecording ? 'bg-[#18181b] shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-[#18181b] border border-white/5'}`}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Mic className={`w-[18px] h-[18px] ${isRecording ? 'text-red-500 fill-red-500' : 'text-zinc-400 hover:text-zinc-200'}`} />
              </div>
            )}
          </div>
        )}
      </div>
      {errorMsg && (
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full text-xs font-medium z-50">
              {errorMsg}
          </div>
      )}
    </div>
  );
}
