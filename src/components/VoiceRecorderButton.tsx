import React, { useRef, useState, useEffect } from 'react';
import { Mic, Square, Trash, Send, Play, Pause } from 'lucide-react';
import { useVoiceRecorder, formatDuration, RecordingStatus } from '../hooks/useVoiceRecorder';
import { uploadVoiceToStorage } from '../services/fileApi';
import { db } from '../lib/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

interface VoiceRecorderButtonProps {
    currentUser: any;
    conversation: any;
    scrollToBottom: (instant?: boolean) => void;
    onStatusChange: (status: RecordingStatus) => void;
}

export default function VoiceRecorderButton({ currentUser, conversation, scrollToBottom, onStatusChange }: VoiceRecorderButtonProps) {
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
    } = useVoiceRecorder(300); // 5 minutes max

    const isRecording = status === "recording";
    const isPreview = status === "preview";
    const isUploading = status === "uploading";

    // Only notify parent when recording or not recording
    useEffect(() => {
        onStatusChange(status);
    }, [status, onStatusChange]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (status !== 'idle' && status !== 'error') return;
        // prevent default might block scroll, be careful, but we want to prevent click double fires
        // e.preventDefault(); 
        startRecording();
    };

    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (isRecording) {
           stopRecording();
        }
    };
    
    // To handle mouse leave if holding click and moving cursor away
    const handleMouseLeave = () => {
        if (isRecording) {
            stopRecording();
        }
    };

    const handleSend = async () => {
        if (!audioBlob || !conversation || !currentUser) return;
        
        try {
            setStatus("uploading");
            const messageId = crypto.randomUUID();
            
            // Upload to Supabase first
            const result = await uploadVoiceToStorage(conversation._id, messageId, audioBlob);
            
            // Register message in Firebase
            const newMsg = {
                _id: messageId,
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
            
            await addDoc(collection(db, "messages"), newMsg);
            
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

    if (errorMsg) {
        return (
            <div className="flex items-center absolute right-[68px] bottom-3 bg-red-500/20 text-red-400 px-3 py-2 rounded-xl text-sm max-w-[200px] truncate" title={errorMsg}>
                {errorMsg}
                <button onClick={resetRecording} className="ml-2 hover:text-white">x</button>
            </div>
        );
    }

    if (isPreview) {
        return null; // The preview UI will be rendered by ChatInput taking over the whole input area, but let's re-architecture slightly so VoiceButton renders preview itself, or expose it via ChatInput.
    }

    return (
        <div 
            className="p-3.5 rounded-full cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-zinc-400 select-none touch-none"
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            <Mic className={`w-[19px] h-[19px] ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-zinc-200'}`} />
        </div>
    );
}

// We will export VoicePreview component to be used inside ChatInput
export function VoicePreview({ audioUrl, durationSeconds, onCancel, onSend, isUploading }: { audioUrl: string, durationSeconds: number, onCancel: () => void, onSend: () => void, isUploading: boolean }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    return (
        <div className="flex-1 flex items-center justify-between bg-[#1f1f22]/80 border border-white/10 rounded-full px-5 py-2 z-20">
            <button onClick={onCancel} disabled={isUploading} className="p-2 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50">
                <Trash className="w-[18px] h-[18px]" />
            </button>
            <div className="flex-1 flex items-center gap-3 px-4">
                <button onClick={togglePlay} disabled={isUploading} className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full hover:bg-indigo-500/30 transition-colors disabled:opacity-50">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                    <div 
                        className="absolute left-0 top-0 h-full bg-indigo-500 transition-all duration-100 ease-linear"
                        style={{ width: `${(currentTime / Math.max(1, durationSeconds)) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                    {formatDuration(isPlaying ? currentTime : durationSeconds)}
                </span>
                <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded} 
                    className="hidden" 
                />
            </div>
            <button 
                onClick={onSend} 
                disabled={isUploading} 
                className="bg-indigo-600 p-2.5 rounded-full hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
                {isUploading ? (
                    <div className="w-[18px] h-[18px] border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <Send className="w-[18px] h-[18px] ml-0.5 text-white" />
                )}
            </button>
        </div>
    );
}
