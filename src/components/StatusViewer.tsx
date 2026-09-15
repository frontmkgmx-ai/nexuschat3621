import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, Volume2, VolumeX, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sanitizeUrl } from "../services/storageService";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface StatusViewerProps {
  currentGroup: any;
  viewingStatusIdx: number;
  currentUser: any;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function StatusViewer({ currentGroup, viewingStatusIdx, currentUser, onNext, onPrev, onClose, onRemove }: StatusViewerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const rAFRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const currentStatus = currentGroup.statuses[viewingStatusIdx];

  const getStatusDuration = () => {
     let d = currentStatus.durationSeconds;
     if (!d || !isFinite(d) || d <= 0) {
        d = 5; 
     }
     if (currentStatus.type === 'video' && videoDuration && videoDuration > 0 && isFinite(videoDuration)) {
        // limit to 60s max for video
        return Math.min(videoDuration, 60);
     }
     return d;
  };

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setVideoDuration(null);
    setIsVideoLoading(currentStatus.type === "video");
    
    // Safety fallback
    const safetyTimeout = setTimeout(() => {
       setIsVideoLoading(false);
    }, 5000);

    return () => {
       stopTimer();
       clearTimeout(safetyTimeout);
    };
  }, [currentStatus]);

  useEffect(() => {
    if (isPaused || isVideoLoading) {
      stopTimer();
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      lastTimeRef.current = performance.now();
      startTimer();
      if (videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Video play error:", e);
            setIsPaused(true); 
          });
        }
      }
    }
  }, [isPaused, isVideoLoading, videoDuration]);

  const startTimer = () => {
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    
    const updateProgress = (time: number) => {
      if (isPaused || isVideoLoading) return;
      
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      elapsedRef.current += delta;
      
      const d = getStatusDuration();
      let newProgress = elapsedRef.current / d;
      
      if (newProgress >= 1) {
        newProgress = 1;
        setProgress(100);
        onNext();
        return;
      }
      
      setProgress(newProgress * 100);
      rAFRef.current = requestAnimationFrame(updateProgress);
    };
    
    rAFRef.current = requestAnimationFrame(updateProgress);
  };

  const stopTimer = () => {
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className="fixed inset-0 z-50 bg-black flex flex-col touch-none select-none" 
      onPointerDown={() => setIsPaused(true)} 
      onPointerUp={() => setIsPaused(false)} 
      onPointerLeave={() => setIsPaused(false)} 
      onContextMenu={(e) => e.preventDefault()}
    > 
       <div className="absolute top-0 inset-x-0 w-full flex gap-1 p-2 pt-4 px-2 z-30 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"> 
         {currentGroup.statuses.map((s: any, index: number) => ( 
           <div key={s.id || index} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"> 
             <div 
                className="h-full bg-white rounded-full origin-left" 
               style={{ 
                 width: index < viewingStatusIdx ? "100%" : (index === viewingStatusIdx ? `${progress}%` : "0%")
               }} 
             /> 
           </div> 
         ))} 
       </div> 
       
       <div className="absolute top-6 inset-x-0 p-4 pt-6 flex items-center justify-between z-20 pointer-events-none"> 
          <div className="flex items-center gap-3 drop-shadow-md"> 
             <img 
                src={sanitizeUrl(currentGroup.userAvatar) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentGroup.userId}`} 
                className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" 
                alt={currentGroup.userName}
             /> 
             <div> 
               <h4 className="text-white font-bold">{currentGroup.userName}</h4> 
               <p className="text-white/80 text-xs shadow-black drop-shadow-md"> 
                  {(() => { 
                    const date = new Date(currentStatus.createdAt); 
                    return !isNaN(date.getTime()) 
                       ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR }) 
                       : "Data inválida"; 
                  })()} 
               </p> 
             </div> 
          </div> 
          <div className="flex items-center gap-3 pointer-events-auto"> 
             {currentStatus.userId === currentUser._id && ( 
               <button onClick={(e) => { e.stopPropagation(); onRemove(currentStatus.id); }} className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm transition-colors" aria-label="Remover"> 
                  <Trash2 className="w-5 h-5" /> 
               </button> 
             )} 
             {currentStatus.type === "video" && ( 
               <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors" aria-label="Mutar"> 
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />} 
               </button> 
             )} 
             <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors" aria-label="Fechar"> 
                <X className="w-5 h-5" /> 
             </button> 
          </div> 
       </div> 
       
       <motion.div 
         drag="x" 
         dragConstraints={{ left: 0, right: 0 }} 
         dragElastic={0.2} 
         onDragEnd={(e, { offset }) => { 
           const swipe = offset.x; 
           if (swipe < -50) { 
             onNext(); 
           } else if (swipe > 50) { 
             onPrev(); 
           } 
         }} 
         className={`flex-1 flex items-center justify-center p-0 md:p-6 w-full h-full relative ${!currentStatus.url ? (currentStatus.bgColor || 'bg-zinc-800') : 'bg-black'}`} 
       > 
         {currentStatus.type === "image" && currentStatus.url && ( 
           <TransformWrapper 
             initialScale={1} 
             minScale={1} 
             maxScale={4} 
             centerOnInit 
             wheel={{ activationKeys: ["Control"] }} 
             panning={{ disabled: false }} 
             doubleClick={{ step: 0.5 }} 
           > 
             <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center"> 
               <img src={currentStatus.url} className="w-full h-full object-contain pointer-events-none" alt="Status" /> 
             </TransformComponent> 
           </TransformWrapper> 
         )} 
         
         {currentStatus.type === "video" && currentStatus.url && ( 
           <video 
             key={currentStatus.id}
             ref={videoRef} 
             src={currentStatus.url} 
             className="absolute inset-0 w-full h-full object-contain" 
             autoPlay 
             muted={isMuted} 
             playsInline 
             onLoadedMetadata={(e) => { 
               const d = e.currentTarget.duration;
               if (d > 0 && isFinite(d)) { 
                 setVideoDuration(d);
               }
               setIsVideoLoading(false);
             }} 
             onCanPlay={() => {
               setIsVideoLoading(false);
             }}
             onEnded={() => {
               if (!isPaused) {
                 setProgress(100);
                 onNext();
               }
             }}
             onError={(e) => {
               console.error("Status video playback error", e);
               setIsVideoLoading(false);
             }}
           /> 
         )} 
         
         {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                 <VolumeX className="w-8 h-8 text-white opacity-0" /> 
              </div>
            </div>
         )}
         
         <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); onPrev(); }} /> 
         <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); onNext(); }} /> 
         
         {currentStatus.url && currentStatus.text && ( 
           <div className="absolute inset-x-0 bottom-0 top-2/3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" /> 
         )} 
         {currentStatus.text && ( 
            <p className={`relative z-10 pointer-events-none text-white font-bold text-center leading-tight max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${currentStatus.url ? 'text-xl md:text-2xl mt-auto pb-12 px-6' : 'text-3xl md:text-5xl px-6'}`}> 
              {currentStatus.text} 
            </p> 
         )} 
       </motion.div> 
    </motion.div> 
  );
}
